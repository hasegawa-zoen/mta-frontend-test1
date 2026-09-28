import tenantConfigJson from "../../tenant.config.json";

export interface TenantConfig {
  tenantName: string;
  logoUrl: string;
  accentColor: string;
}

export const tenantConfig: TenantConfig = tenantConfigJson;
