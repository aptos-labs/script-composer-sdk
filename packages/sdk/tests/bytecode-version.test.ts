import { expect, test } from 'vitest';
import {
  AptosConfig,
  Network,
  MoveModuleBytecode,
  getAptosFullNode,
  AccountAddress,
  Hex,
} from '@aptos-labs/ts-sdk';
import { AptosScriptComposer } from '../src/index';

/**
 * Mutates the Move bytecode header version field in a hex-encoded bytecode string.
 * Move binary format: magic (4 bytes) + version (u32 LE).
 */
function setBytecodeVersion(bytecode: string, version: number): string {
  const bytes = Hex.fromHexInput(bytecode).toUint8Array().slice();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  view.setUint32(4, version, true);
  return Hex.fromHexInput(bytes).toString();
}

/**
 * Builds a minimal valid Move module bytecode with the requested version header.
 * This uses a real Aptos framework module as a template and overwrites its version.
 */
async function buildModuleWithVersion(
  baseModule: MoveModuleBytecode,
  version: number
): Promise<MoveModuleBytecode> {
  return {
    ...baseModule,
    bytecode: setBytecodeVersion(baseModule.bytecode, version),
  };
}

async function fetchAptosAccountModule(aptosConfig: AptosConfig): Promise<MoveModuleBytecode> {
  const { data } = await getAptosFullNode<{}, MoveModuleBytecode>({
    aptosConfig,
    originMethod: 'getModule',
    path: `accounts/${AccountAddress.ONE.toString()}/module/aptos_account`,
  });
  return data;
}

test('composer accepts Move bytecode version 10 with flavor header (0x0A00000A)', async () => {
  const aptosConfig = new AptosConfig({ network: Network.TESTNET });
  const composer = new AptosScriptComposer(aptosConfig);

  // The reported mainnet module (panora_swap) uses version header 0x0A00000A.
  // We simulate the same header by rewriting a known Testnet module's version field.
  const baseModule = await fetchAptosAccountModule(aptosConfig);
  const moduleWithNewHeader = await buildModuleWithVersion(baseModule, 0x0a00000a);

  expect(() => composer.storeModule(moduleWithNewHeader, '0x1::aptos_account')).not.toThrow();
});

test('composer rejects unsupported Move bytecode version 99', async () => {
  const aptosConfig = new AptosConfig({ network: Network.TESTNET });
  const composer = new AptosScriptComposer(aptosConfig);

  const baseModule = await fetchAptosAccountModule(aptosConfig);
  const moduleWithBadVersion = await buildModuleWithVersion(baseModule, 99);

  expect(() => composer.storeModule(moduleWithBadVersion, '0x1::aptos_account')).toThrow(
    /bytecode version 99 unsupported/
  );
});
