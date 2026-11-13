export interface AircraftInfo {
  registration?: string;
  icaoType?: string;
  fullType?: string;
  operator?: string;
  manufacturer?: string;
}

interface RawHexDb {
  ModeS?: string;
  Registration?: string;
  ICAOTypeCode?: string;
  Type?: string;
  RegisteredOwners?: string;
  Manufacturer?: string;
  OperatorFlagCode?: string;
}

const ENDPOINT = 'https://hexdb.io/api/v1/aircraft';

export async function lookupAircraft(
  hex: string,
  signal?: AbortSignal,
): Promise<AircraftInfo | null> {
  const res = await fetch(`${ENDPOINT}/${hex.toUpperCase()}`, { signal });
  if (!res.ok) return null;
  const data = (await res.json()) as RawHexDb;
  if (!data.ModeS) return null;
  return {
    registration: data.Registration,
    icaoType: data.ICAOTypeCode,
    fullType: data.Type,
    operator: data.RegisteredOwners,
    manufacturer: data.Manufacturer,
  };
}
