import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfile from "./tools/get-my-profile";
import listMyActivity from "./tools/list-my-activity";
import updateMyLevel from "./tools/update-my-level";
import listRoutines from "./tools/list-routines";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "gymbros-mcp",
  title: "GYMBRO'S",
  version: "0.1.0",
  instructions:
    "GYMBRO'S gym management tools. Use list_routines to browse public workout programs (filter by level or gender). Use get_my_profile, list_my_activity, and update_my_level for the signed-in user's data.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listRoutines, getMyProfile, listMyActivity, updateMyLevel],
});
