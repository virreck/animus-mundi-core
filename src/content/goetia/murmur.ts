import type { GoetiaDef } from '../../engine/state';

export const murmur: GoetiaDef = {
  id: "murmur",
  name: "Murmur",
  title: "Duke of the Pale Rider",
  description: "A Great Duke and Earl, riding upon a Vulture. He manifests through severe temperature drops and the calcification of root systems. He commands the souls of the dead.",
  requiredIntel: ["temp_drop", "ozone_scent", "calcified_roots"],
  sealCost: { "consecrated_salt": 1, "cold_iron_filings": 2 }
};