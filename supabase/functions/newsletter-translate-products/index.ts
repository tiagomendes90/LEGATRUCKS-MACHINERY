// Alias de compatibilidade: a newsletter usa o motor central de tradução.
import { handleTranslateProducts } from "../_shared/translateProducts.ts";

Deno.serve(handleTranslateProducts);
