import { AptosConfig, getFunctionParts, AptosApiType, standardizeTypeTags, fetchModuleAbi, convertArgument, MoveFunctionId, TypeArgument, EntryFunctionArgumentTypes, MoveModule, SimpleEntryFunctionArgumentTypes, TransactionPayloadScript, Deserializer, AccountAddressInput, InputGenerateTransactionOptions, generateRawTransaction, AccountAddress, SimpleTransaction, MoveModuleBytecode, Hex } from "@aptos-labs/ts-sdk";
import { initSync, TransactionComposer, wasmModule, CallArgument} from "@aptos-labs/script-composer-pack";

export type InputBatchedFunctionData = {
  function: MoveFunctionId;
  typeArguments?: Array<TypeArgument>;
  functionArguments: Array<EntryFunctionArgumentTypes | CallArgument | SimpleEntryFunctionArgumentTypes>;
  moduleAbi: MoveModule;
  moduleBytecodes?: string[];
};

export class AptosScriptComposer {
  private config: AptosConfig;

  private builder: TransactionComposer;

  private static transactionComposer?: any;

  constructor(aptosConfig: AptosConfig) {
    this.config = aptosConfig;
     if (!AptosScriptComposer.transactionComposer) {
      initSync({ module: wasmModule });
      AptosScriptComposer.transactionComposer = TransactionComposer;
     }
     this.builder = AptosScriptComposer.transactionComposer.single_signer();
  }

  storeModule(module: MoveModuleBytecode) {
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
    
    moduleBytecode?.forEach((module)=>{
      this.builder.store_module(Hex.fromHexInput(module).toUint8Array());
    });

    if (input.typeArguments !== undefined) {
      for (const typeArgument of input.typeArguments) {
        
      }
    }

    const typeArguments = standardizeTypeTags(input.typeArguments);
    let moduleAbi: MoveModule | undefined = undefined;
    if (!module) {
      moduleAbi = await fetchModuleAbi(moduleAddress, moduleName, this.config);
      if (!moduleAbi) {
        throw new Error(`Could not find module ABI for '${moduleAddress}::${moduleName}'`);
      }
    }else {
      moduleAbi = module;
    }

    // Check the type argument count against the ABI
    const functionAbi = moduleAbi.exposed_functions.find((func) => func.name === functionName);
    if (!functionAbi) {
      throw new Error(`Could not find function ABI for '${moduleAddress}::${moduleName}::${functionName}'`);
    }
    
    if (typeArguments.length !== functionAbi.generic_type_params.length) {
      throw new Error(
        `Type argument count mismatch, expected ${functionAbi?.generic_type_params.length}, received ${typeArguments.length}`,
      );
    }

    const functionArguments: CallArgument[] = input.functionArguments.map((arg, i) =>
      arg instanceof CallArgument
        ? arg
        : CallArgument.newBytes(
            convertArgument(functionName, moduleAbi, arg, i, typeArguments, { allowUnknownStructs: true }).bcsToBytes(),
          ),
    );

    return this.builder.add_batched_call(
      `${moduleAddress}::${moduleName}`,
      functionName,
      typeArguments.map((arg) => arg.toString()),
      functionArguments,
    );
  }

  build(): Uint8Array {
    return this.builder.generate_batched_calls(true);
  }

  build_payload(): TransactionPayloadScript {
    return TransactionPayloadScript.load(new Deserializer(this.build()));
  }
}


export async function BuildScriptComposerTransaction(
  args: {
    sender: AccountAddressInput;
    builder: (builder: AptosScriptComposer) => Promise<AptosScriptComposer>;
    aptosConfig: AptosConfig;
    options?: InputGenerateTransactionOptions;
    withFeePayer?: boolean;
  }
): Promise<SimpleTransaction> {
  const composer = new AptosScriptComposer(args.aptosConfig);
  const builder = await args.builder(composer);
  const bytes = builder.build();
  const rawTxn = await generateRawTransaction({
    payload: TransactionPayloadScript.load(new Deserializer(bytes)),
    ...args,
  });
  return new SimpleTransaction(rawTxn, args.withFeePayer === true ? AccountAddress.ZERO : undefined);
}