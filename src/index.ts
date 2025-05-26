import { AptosConfig, getFunctionParts, AptosApiType, standardizeTypeTags, fetchModuleAbi, convertArgument, MoveFunctionId, TypeArgument, EntryFunctionArgumentTypes, MoveModule, SimpleEntryFunctionArgumentTypes } from "@aptos-labs/ts-sdk";
import { initSync, TransactionComposer, ScriptComposerWasm, CallArgument} from "@aptos-labs/script-composer-pack";

export type InputBatchedFunctionData = {
  function: MoveFunctionId;
  typeArguments?: Array<TypeArgument>;
  functionArguments: Array<EntryFunctionArgumentTypes | CallArgument | SimpleEntryFunctionArgumentTypes>;
  module?: MoveModule;
};

export class AptosScriptComposer {
  private config: AptosConfig;

  private builder: TransactionComposer;

  private static transactionComposer?: any;

  constructor(aptosConfig: AptosConfig) {
    this.config = aptosConfig;
     if (!AptosScriptComposer.transactionComposer) {
      if (!ScriptComposerWasm.isInitialized) {
        ScriptComposerWasm.init();
      }
      initSync({ module: ScriptComposerWasm.wasm });
      AptosScriptComposer.transactionComposer = TransactionComposer;
     }
     this.builder = AptosScriptComposer.transactionComposer.single_signer();
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
    const module = input.module;
    const nodeUrl = this.config.getRequestUrl(AptosApiType.FULLNODE);

    // Load the calling module into the builder.
    await this.builder.load_module(nodeUrl, `${moduleAddress}::${moduleName}`);

    // Load the calling type arguments into the loader.
    if (input.typeArguments !== undefined) {
      for (const typeArgument of input.typeArguments) {
        await this.builder.load_type_tag(nodeUrl, typeArgument.toString());
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
}