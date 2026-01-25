import {
  AptosConfig,
  getFunctionParts,
  standardizeTypeTags,
  fetchModuleAbi,
  convertArgument,
  MoveFunctionId,
  TypeArgument,
  EntryFunctionArgumentTypes,
  MoveModule,
  SimpleEntryFunctionArgumentTypes,
  TransactionPayloadScript,
  Deserializer,
  AccountAddressInput,
  InputGenerateTransactionOptions,
  generateRawTransaction,
  AccountAddress,
  SimpleTransaction,
  MoveModuleBytecode,
  Hex,
  TypeTag,
  TypeTagStruct,
  parseTypeTag,
  LedgerVersionArg,
  getAptosFullNode,
  MultiAgentTransaction,
} from '@aptos-labs/ts-sdk';
import {
  initSync,
  TransactionComposer,
  wasmModule,
  CallArgument,
} from '@aptos-labs/script-composer-pack';

export * from '@aptos-labs/script-composer-pack';

export type InputBatchedFunctionData = {
  function: MoveFunctionId;
  typeArguments?: Array<TypeArgument>;
  functionArguments: Array<
    EntryFunctionArgumentTypes | CallArgument | SimpleEntryFunctionArgumentTypes
  >;
  moduleAbi?: MoveModule;
  moduleBytecodes?: string[];
  options?: {
    /** @default true - Automatically fetch missing modules from the chain */
    allowFetch?: boolean;
  };
};

export class AptosScriptComposer {
  private config: AptosConfig;

  private builder: TransactionComposer;

  private static transactionComposer?: typeof TransactionComposer;

  private static loadedModulesCache: Map<string, MoveModuleBytecode> = new Map();

  private storedModulesMap: Set<string> = new Set();

  constructor(aptosConfig: AptosConfig, numSigners: number = 1, hasFeePayer: boolean = false) {
    this.config = aptosConfig;
    if (!AptosScriptComposer.transactionComposer) {
      initSync({ module: wasmModule });
      AptosScriptComposer.transactionComposer = TransactionComposer;
    }
    // Use multi_signer if there are multiple signers OR if there's a fee payer
    this.builder =
      numSigners > 1 || hasFeePayer
        ? AptosScriptComposer.transactionComposer.multi_signer(numSigners)
        : AptosScriptComposer.transactionComposer.single_signer();
  }

  storeModule(module: MoveModuleBytecode, moduleName?: string): void {
    if (!moduleName && !module.abi) throw new Error('Module ABI is not supported in this context');
    const moduleId = moduleName ? moduleName : `${module.abi?.address}::${module.abi?.name}`;
    if (moduleId && !AptosScriptComposer.loadedModulesCache.has(moduleId)) {
      AptosScriptComposer.loadedModulesCache.set(moduleId, module);
    }
    if (moduleId && this.storedModulesMap.has(moduleId)) {
      return;
    }
    if (moduleId) {
      this.storedModulesMap.add(moduleId);
    }
    this.builder.store_module(Hex.fromHexInput(module.bytecode).toUint8Array());
  }

  // Add a move function invocation to the TransactionComposer.
  //
  // Similar to how to create an entry function, the difference is that input arguments could
  // either be a `CallArgument` which represents an abstract value returned from a previous Move call
  // or the regular entry function arguments.
  //
  // The function would also return a list of `CallArgument` that can be passed on to future calls.
  //
  // Validation behavior:
  // - If allowFetch is true (default): Validates that the function exists in the provided ABI (if any)
  // - If allowFetch is false: Requires both moduleAbi and moduleBytecodes to be provided
  // - Automatically fetches missing modules from the chain when allowFetch is enabled
  async addBatchedCalls(input: InputBatchedFunctionData): Promise<CallArgument[]> {
    const { moduleAddress, moduleName, functionName } = getFunctionParts(input.function);
    const module = input.moduleAbi;
    const moduleBytecode = input.moduleBytecodes;
    const autoFetch = input.options?.allowFetch ?? true;

    // Validation logic based on auto-fetch option
    if (autoFetch) {
      // Auto-fetch mode: Check if function exists in ABI
      if (module) {
        const functionAbi = module.exposed_functions.find((func) => func.name === functionName);
        if (!functionAbi) {
          throw new Error(
            `Function '${functionName}' not found in provided ABI for module '${moduleAddress}::${moduleName}'`
          );
        }
      }
    } else {
      // Manual mode: Check if both ABI and bytecode are provided
      if (!module) {
        throw new Error(
          `Module ABI is required when auto-fetch is disabled for '${moduleAddress}::${moduleName}'`
        );
      }
      if (!moduleBytecode || moduleBytecode.length === 0) {
        throw new Error(
          `Module bytecode is required when auto-fetch is disabled for '${moduleAddress}::${moduleName}'`
        );
      }
    }

    moduleBytecode?.forEach((module) => {
      this.builder.store_module(Hex.fromHexInput(module).toUint8Array());
    });

    const moduleId = `${moduleAddress}::${moduleName}`;
    const isModuleLoaded = AptosScriptComposer.loadedModulesCache.has(moduleId);
    const isModuleStored = this.storedModulesMap.has(moduleId);

    // If the module is not loaded in the global cache (isModuleLoaded) or not stored in the local map (isModuleStored),
    // and autoFetch is enabled, we need to fetch and store the module.
    // This ensures that the module is available both globally and locally for execution.
    if ((!isModuleLoaded || !isModuleStored) && autoFetch) {
      // If the module is not loaded, we can fetch it.
      const moduleBytecode = await getModuleInner({
        aptosConfig: this.config,
        accountAddress: moduleAddress,
        moduleName: moduleName.toString(),
      });
      if (moduleBytecode) {
        this.storeModule(moduleBytecode, moduleId);
      } else {
        throw new Error(
          `Module '${moduleAddress}::${moduleName}' could not be fetched. Please ensure it exists on the chain.`
        );
      }
    }

    if (input.typeArguments !== undefined) {
      for (const typeArgument of input.typeArguments) {
        const type_tag = parseTypeTag(typeArgument.toString());
        const requiredModules = await this.collectRequiredModulesFromTypeTag(
          type_tag,
          input.options
        );
        requiredModules.forEach((moduleId) => {
          if (!AptosScriptComposer.loadedModulesCache.has(moduleId)) {
            throw new Error(
              `Module '${moduleId}' is not loaded in the cache. Please load it before using\nit in a batched call.`
            );
          }
          if (!this.storedModulesMap.has(moduleId)) {
            const moduleBytecode = AptosScriptComposer.loadedModulesCache.get(moduleId);
            if (moduleBytecode) {
              this.storeModule(moduleBytecode, moduleId);
            } else {
              throw new Error(
                `Module '${moduleId}' could not be found in the cache. Please ensure it is loaded.`
              );
            }
          }
        });
      }
    }

    const typeArguments = standardizeTypeTags(input.typeArguments);
    let moduleAbi: MoveModule | undefined = undefined;
    if (!module) {
      moduleAbi = await fetchModuleAbi(moduleAddress, moduleName, this.config);
      if (!moduleAbi) {
        throw new Error(`Could not find module ABI for '${moduleAddress}::${moduleName}'`);
      }
    } else {
      moduleAbi = module;
    }

    // Check the type argument count against the ABI
    const functionAbi = moduleAbi.exposed_functions.find((func) => func.name === functionName);
    if (!functionAbi) {
      throw new Error(
        `Could not find function ABI for '${moduleAddress}::${moduleName}::${functionName}'`
      );
    }

    if (typeArguments.length !== functionAbi.generic_type_params.length) {
      throw new Error(
        `Type argument count mismatch, expected ${functionAbi?.generic_type_params.length}, received ${typeArguments.length}`
      );
    }

    const functionArguments: CallArgument[] = input.functionArguments.map((arg, i) =>
      arg instanceof CallArgument
        ? arg
        : CallArgument.newBytes(
            convertArgument(functionName, moduleAbi, arg, i, typeArguments, {
              allowUnknownStructs: true,
            }).bcsToBytes()
          )
    );

    return this.builder.add_batched_call(
      `${moduleAddress}::${moduleName}`,
      functionName,
      typeArguments.map((arg) => arg.toString()),
      functionArguments
    );
  }

  /**
   * Recursively collects all required module IDs from a given TypeTag, ensuring all dependent modules are loaded and stored.
   * If allowFetch is true, missing modules will be fetched from the chain and stored in both the global cache and local composer.
   *
   * @param typeTag - The TypeTag to analyze (can be struct, vector, etc.).
   * @param options - Optional object. If options.allowFetch is true (default), missing modules will be fetched from the chain.
   * @returns Promise<Set<string>> - A set of all module IDs (address::moduleName) required by the typeTag and its nested type arguments.
   * @throws Error if a required module is missing and allowFetch is false, or if fetching fails.
   */
  async collectRequiredModulesFromTypeTag(
    typeTag: TypeTag,
    options?: { allowFetch?: boolean }
  ): Promise<Set<string>> {
    const modules = new Set<string>();
    if (typeTag.isStruct()) {
      const structTag = typeTag as TypeTagStruct;
      const moduleId = `${structTag.value.address}::${structTag.value.moduleName.identifier.toString()}`;
      modules.add(moduleId);
      const autoFetch = options?.allowFetch ?? true;
      if (!AptosScriptComposer.loadedModulesCache.has(moduleId)) {
        if (autoFetch) {
          // If the module is not loaded, we can fetch it.
          const module = await getModuleInner({
            aptosConfig: this.config,
            accountAddress: structTag.value.address,
            moduleName: structTag.value.moduleName.identifier.toString(),
          });
          if (module) {
            this.storeModule(module, moduleId);
          } else {
            throw new Error(
              `Module '${moduleId}' could not be fetched. Please ensure it exists on the chain.`
            );
          }
        } else {
          throw new Error(
            `Module '${moduleId}' is not loaded in the cache. Please load it before using it in a batched call.`
          );
        }
      }
      for (const ty of structTag.value.typeArgs) {
        const result = await this.collectRequiredModulesFromTypeTag(ty, options);
        for (const module of result) {
          modules.add(module);
        }
      }
    } else if (typeTag.isVector()) {
      const result = await this.collectRequiredModulesFromTypeTag(typeTag.value, options);
      for (const module of result) {
        modules.add(module);
      }
    }
    return modules;
  }

  build(): Uint8Array {
    return this.builder.generate_batched_calls(true);
  }

  build_payload(): TransactionPayloadScript {
    return TransactionPayloadScript.load(new Deserializer(this.build()));
  }
}

/**
 * Common base arguments for building script composer transactions
 */
type BaseBuildScriptComposerArgs = {
  sender: AccountAddressInput;
  builder: (builder: AptosScriptComposer) => Promise<AptosScriptComposer>;
  aptosConfig: AptosConfig;
  options?: InputGenerateTransactionOptions;
  secondarySignerAddresses?: Array<AccountAddressInput>;
  feePayerAddress?: AccountAddressInput;
  withFeePayer?: boolean;
};

/**
 * Internal helper to build and generate raw transaction from composer
 */
async function buildRawTransactionFromComposer(args: BaseBuildScriptComposerArgs): Promise<{
  rawTxn: Awaited<ReturnType<typeof generateRawTransaction>>;
  sender: AccountAddressInput;
}> {
  // Calculate total number of signers: 1 (sender) + secondary signers count
  // Note: fee payer does NOT count as a signer
  const numSigners = 1 + (args.secondarySignerAddresses?.length || 0);

  // Check if fee payer is present
  // - BuildScriptComposerMultiAgentTransaction uses feePayerAddress
  // - BuildScriptComposerTransaction uses withFeePayer flag
  const hasFeePayer = args.feePayerAddress !== undefined || args.withFeePayer === true;

  const composer = new AptosScriptComposer(args.aptosConfig, numSigners, hasFeePayer);
  const builtComposer = await args.builder(composer);
  const scriptBytes = builtComposer.build();

  const rawTxn = await generateRawTransaction({
    payload: TransactionPayloadScript.load(new Deserializer(scriptBytes)),
    sender: args.sender,
    aptosConfig: args.aptosConfig,
    options: args.options,
  });

  return { rawTxn, sender: args.sender };
}

export async function BuildScriptComposerTransaction(args: {
  sender: AccountAddressInput;
  builder: (builder: AptosScriptComposer) => Promise<AptosScriptComposer>;
  aptosConfig: AptosConfig;
  options?: InputGenerateTransactionOptions;
  withFeePayer?: boolean;
}): Promise<SimpleTransaction> {
  const { rawTxn } = await buildRawTransactionFromComposer(args);
  return new SimpleTransaction(
    rawTxn,
    args.withFeePayer === true ? AccountAddress.ZERO : undefined
  );
}

/**
 * Builds a multi-agent transaction from a script composer builder.
 *
 * Multi-agent transactions allow multiple signers to participate in a transaction,
 * where the sender is the primary signer and additional signers can be added.
 *
 * @param args - Configuration for building the multi-agent transaction
 * @param args.sender - The primary account address that will sign the transaction
 * @param args.builder - Async function that receives and returns an AptosScriptComposer instance
 * @param args.aptosConfig - Aptos configuration for network and API settings
 * @param args.options - Optional transaction generation options
 * @param args.secondarySignerAddresses - Optional array of secondary signer addresses for multi-agent transactions
 * @param args.feePayerAddress - Optional account address that sponsors the transaction's gas fees
 * @returns Promise resolving to a MultiAgentTransaction ready for signing
 *
 * @example
 * ```typescript
 * const transaction = await BuildScriptComposerMultiAgentTransaction({
 *   sender: myAccount.address,
 *   aptosConfig: config,
 *   secondarySignerAddresses: [otherAccount.address],
 *   feePayerAddress: sponsorAccount.address,
 *   builder: async (composer) => {
 *     await composer.addBatchedCalls([...]);
 *     return composer;
 *   }
 * });
 * ```
 */
export async function BuildScriptComposerMultiAgentTransaction(args: {
  sender: AccountAddressInput;
  builder: (builder: AptosScriptComposer) => Promise<AptosScriptComposer>;
  aptosConfig: AptosConfig;
  options?: InputGenerateTransactionOptions;
  secondarySignerAddresses?: Array<AccountAddressInput>;
  feePayerAddress?: AccountAddressInput;
}): Promise<MultiAgentTransaction> {
  const { rawTxn } = await buildRawTransactionFromComposer({
    ...args,
    secondarySignerAddresses: args.secondarySignerAddresses,
    feePayerAddress: args.feePayerAddress,
  });

  const secondarySigners: AccountAddress[] = args.secondarySignerAddresses
    ? args.secondarySignerAddresses.map((signer) => AccountAddress.from(signer))
    : [];

  const feePayer = args.feePayerAddress ? AccountAddress.from(args.feePayerAddress) : undefined;

  return new MultiAgentTransaction(rawTxn, secondarySigners, feePayer);
}

export async function getModuleInner(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  moduleName: string;
  options?: LedgerVersionArg;
}): Promise<MoveModuleBytecode> {
  const { aptosConfig, accountAddress, moduleName, options } = args;

  const { data } = await getAptosFullNode<{}, MoveModuleBytecode>({
    aptosConfig,
    originMethod: 'getModule',
    path: `accounts/${AccountAddress.from(accountAddress).toString()}/module/${moduleName}`,
    params: { ledger_version: options?.ledgerVersion },
  });
  return data;
}
