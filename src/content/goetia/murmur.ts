// src/content/goetia/murmur.ts
import type { GoetiaDef } from '../../engine/state';

export const murmur: GoetiaDef = {
  id: "murmur",
  name: "Murmur",
  title: "Duke of the Pale Rider",
  description: "A Great Duke and Earl, riding upon a Vulture. He manifests through severe temperature drops and the calcification of root systems. He commands the souls of the dead.",
  
  // The player MUST gather these exact three tags from narrative choices to identify him
  requiredIntel: [
    "temp_drop", 
    "ozone_scent", 
    "calcified_roots"
  ],
  
  // The items required to execute the sealing ritual
  sealCost: {
    "consecrated_salt": 1,
    "cold_iron_filings": 2
  }
};