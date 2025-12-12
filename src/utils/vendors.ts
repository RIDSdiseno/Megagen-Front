export type VendorRole = "vendedor" | "supervisor" | "admin" | "bodeguero";

export type Vendor = {
  id: number;
  nombre: string;
  email: string;
  rol: VendorRole;
  region?: string;
};

export const vendors: Vendor[] = [
  { id: 1, nombre: "Luis Herrera", email: "vendedor@megagen.cl", rol: "vendedor", region: "Centro" },
  { id: 2, nombre: "Paula Rios", email: "vendedor.sur@megagen.cl", rol: "vendedor", region: "Sur" },
  { id: 3, nombre: "Supervisor Norte", email: "supervisor.norte@megagen.cl", rol: "supervisor", region: "Norte" },
  { id: 4, nombre: "Admin MegaGen", email: "admin@megagen.cl", rol: "admin" },
  { id: 5, nombre: "Bodega Central", email: "bodega@megagen.cl", rol: "bodeguero" },
  { id: 6, nombre: "Soporte", email: "soporte@megagen.cl", rol: "bodeguero" },
];

export const vendorById: Record<number, Vendor> = vendors.reduce((acc, v) => {
  acc[v.id] = v;
  return acc;
}, {} as Record<number, Vendor>);

export function findVendorByEmail(email?: string) {
  if (!email) return undefined;
  return vendors.find((v) => v.email === email);
}
