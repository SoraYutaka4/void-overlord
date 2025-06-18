import {
    getPowerDashboard,
    getSkillBagImage,
    randomSkillImage,
    updateEquippedSkill,
    getPowerInfo,
    IGetPowerDashboardParams,
    IGetSkillBagImageParams,
    IRandomSkillImageParams,
    IUpdateEquippedSkillBody,
    IGetPowerInfoParams,
  } from "../controllers/requestToApi";
  
  import { CommandMessage as Message } from "../types";
  import { Power } from "../types/user";
  
  // --- Type ---
  export type PVPInfo = {
    userIdA: string;
    userIdB: string;
  };
  
  export type PowerPayload =
    | IGetPowerDashboardParams
    | IGetSkillBagImageParams
    | IRandomSkillImageParams
    | IUpdateEquippedSkillBody
    | IGetPowerInfoParams
    | PVPInfo;
  
  export type PowerAction = "dashboard" | "gacha" | "equip" | "power" | "bag" | "pvp";
  export type CombatResult = "win" | "lose" | "draw";
  
  // --- Main Handler ---
  export async function handlePowerAction(
    action: PowerAction,
    payload: PowerPayload,
    message: Message
  ) {
    try {
      switch (action) {
        case "dashboard":
          return await getPowerDashboard(payload as IGetPowerDashboardParams, "stream");
  
        case "bag":
          if ("page" in payload && "avt" in payload) {
            return await getSkillBagImage(payload as IGetSkillBagImageParams, "stream");
          }
          console.error(`Missing "page" or "avt" in payload for "bag" action.`);
          break;
  
        case "gacha":
          return await randomSkillImage(payload as IRandomSkillImageParams, "stream");
  
        case "equip":
          return await updateEquippedSkill(payload as IUpdateEquippedSkillBody, "text");
  
        case "power":
          return await getPowerInfo(message.senderID);
  
        case "pvp":
          if ("userIdA" in payload && "userIdB" in payload) {
            return await combatBetweenUsers(payload.userIdA, payload.userIdB);
          }
          console.error(`Missing "userIdA" or "userIdB" in payload for "pvp" action.`);
          break;

        default:
          console.error(`Unsupported action: ${action}`);
      }
    } catch (err) {
      console.error(`[handlePowerAction] Error in action "${action}":`, err);
      throw err;
    }
  }
  
  // --- Combat Logic ---
  export function combatPower(userA: Power, userB: Power): CombatResult {
    const totalA = userA.attack + userA.defense;
    const totalB = userB.attack + userB.defense;
  
    if (totalA > totalB) return "win";
    if (totalA < totalB) return "lose";
    return "draw";
  }
  
  export async function combatBetweenUsers(userIdA: string, userIdB: string): Promise<{
    userA: Power;
    userB: Power;
    result: CombatResult;
  }> {
    try {
      const [userA, userB] = await Promise.all([
        getPowerInfo(userIdA),
        getPowerInfo(userIdB),
      ]);
  
      const result = combatPower(userA, userB);
  
      return {
        userA,
        userB,
        result,
      };
    } catch (err) {
      console.error("[combatBetweenUsers] Error:", err);
      throw err;
    }
  }
  