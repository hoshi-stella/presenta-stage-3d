import { selectDirectionAssets } from "../assets/assetCatalog";
import type { DirectionAssetResolution } from "../assets/assetCatalog";
import type { AiDirectionIntent } from "./aiClient";
import type { CharacterId } from "../presentation/types";

export type MockAiDirectionSelectionInput = {
  speaker: CharacterId;
  direction: AiDirectionIntent;
  recentlyUsedAssetIds?: Record<string, number>;
  nowMs?: number;
};

export function selectAssetsForMockAiDirection(input: MockAiDirectionSelectionInput): DirectionAssetResolution {
  return selectDirectionAssets({
    ...input.direction,
    speaker: input.speaker,
    recentlyUsedAssetIds: input.recentlyUsedAssetIds,
    nowMs: input.nowMs
  });
}
