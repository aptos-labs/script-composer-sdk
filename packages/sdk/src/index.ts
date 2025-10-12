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
    allowFetch?: boolean;
  };
};

export class AptosScriptComposer {
  private config: AptosConfig;

  private builder: TransactionComposer;

  private static transactionComposer?: typeof TransactionComposer;

  private static loadedModulesCache: Map<string, MoveModuleBytecode> = new Map();

  private storedModulesMap: Set<string> = new Set();

  constructor(aptosConfig: AptosConfig) {
    this.config = aptosConfig;
    if (!AptosScriptComposer.transactionComposer) {
      initSync({ module: wasmModule });
      AptosScriptComposer.transactionComposer = TransactionComposer;
    }
    this.builder = AptosScriptComposer.transactionComposer.single_signer();
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
  async addBatchedCalls(input: InputBatchedFunctionData): Promise<CallArgument[]> {
    const { moduleAddress, moduleName, functionName } = getFunctionParts(input.function);
    const module = input.moduleAbi;
    const moduleBytecode = input.moduleBytecodes;
    const autoFetch = input.options?.allowFetch !== false; // Default to true

    // Validation logic based on auto-fetch option
    if (autoFetch) {
      // Auto-fetch mode: Check if function exists in ABI
      if (module) {
        const functionAbi = module.exposed_functions.find((func) => func.name === functionName);
        if (!functionAbi) {
          throw new Error(
            `Function '${functionName}' not found in provided ABI for module '${moduleAddress}::${moduleName}'`
          );
        };
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

    // If module is not loaded or not stored, and autoFetch is enabled, fetch and store it
    if ((!isModuleLoaded || !isModuleStored) && autoFetch) {
      if (input.options?.allowFetch !== false) {
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
      } else {
        throw new Error(
          `Module '${moduleAddress}::${moduleName}' is not loaded in the cache and autoFetch is disabled. Please load it before using it in a batched call.`
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
   * Recursively collects all required module IDs from a given TypeTag, ensuring all dependent modules are present in the cache.
   * If allowFetch is true, missing modules will be fetched from the chain and added to the cache.
   *
   * @param typeTag - The TypeTag to analyze (can be struct, vector, etc.).
   * @param options - Optional object. If options.allowFetch is true, missing modules will be fetched from the chain.
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
      if (!AptosScriptComposer.loadedModulesCache.has(moduleId)) {
        if (options?.allowFetch) {
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

export async function BuildScriptComposerTransaction(args: {
  sender: AccountAddressInput;
  builder: (builder: AptosScriptComposer) => Promise<AptosScriptComposer>;
  aptosConfig: AptosConfig;
  options?: InputGenerateTransactionOptions;
  withFeePayer?: boolean;
}): Promise<SimpleTransaction> {
  const composer = new AptosScriptComposer(args.aptosConfig);
  const builder = await args.builder(composer);
  const bytes = builder.build();
  const rawTxn = await generateRawTransaction({
    payload: TransactionPayloadScript.load(new Deserializer(bytes)),
    ...args,
  });
  return new SimpleTransaction(
    rawTxn,
    args.withFeePayer === true ? AccountAddress.ZERO : undefined
  );
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
