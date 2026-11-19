import { create } from "zustand";
import { IOT_COMPONENTS } from "../data/iot101InteractiveData";

/**
 * useIoT101Store
 * จัดการ State การเรียนรู้ของหลักสูตร IoT 101:
 * - ความคืบหน้ารายตอน (Completed Episodes)
 * - อุปกรณ์ที่ปลดล็อก (Unlocked Components)
 * - พิมพ์เขียวระบบที่ปลดล็อก (Unlocked Blueprint Chapters)
 * - จุดสำรวจบนแผนที่สวนนาวา (Explored Map Zones)
 * - Modal แสดงความยินดีเมื่อปลดล็อก (Unlock Experience)
 * บันทึกลงใน localStorage อัตโนมัติโดยไม่กระทบ Backend / Database
 */

const STORAGE_KEY = "iot101_learning_progress";

const getSavedState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn("Could not load iot101 progress from localStorage:", err);
  }
  return null;
};

const defaultInitialState = {
  // ตอนที่เรียนจบแล้ว (เริ่มต้นมี ep-0-1, ep-0-2, ep-1-1 ตามหลักสูตร)
  completedEpisodes: ["ep-0-1", "ep-0-2", "ep-1-1"],
  currentEpisodeId: "ep-1-2",
  // อุปกรณ์ที่ปลดล็อกแล้ว (ep-1-1 ปลดล็อก soil_moisture)
  unlockedComponentIds: ["soil_moisture"],
  // เลเวลของพิมพ์เขียวระบบ (Chapter 1 ปลดล็อกแล้ว)
  unlockedBlueprintChapters: [1],
  // ความสามารถพิเศษที่ได้รับ
  unlockedAbilities: ["SENSE"],
  // จุดในแผนที่สวนที่สำรวจแล้ว
  exploredMapZones: ["trees", "tank"],
  // ข้อมูลการปลดล็อกล่าสุดเพื่อแสดงผลบน UnlockModal
  latestUnlockInfo: null,
  isUnlockModalOpen: false,
};

const saved = getSavedState() || {};

export const useIoT101Store = create((set, get) => ({
  completedEpisodes: saved.completedEpisodes || defaultInitialState.completedEpisodes,
  currentEpisodeId: saved.currentEpisodeId || defaultInitialState.currentEpisodeId,
  unlockedComponentIds: saved.unlockedComponentIds || defaultInitialState.unlockedComponentIds,
  unlockedBlueprintChapters:
    saved.unlockedBlueprintChapters || defaultInitialState.unlockedBlueprintChapters,
  unlockedAbilities: saved.unlockedAbilities || defaultInitialState.unlockedAbilities,
  exploredMapZones: saved.exploredMapZones || defaultInitialState.exploredMapZones,
  latestUnlockInfo: null,
  isUnlockModalOpen: false,

  // Helper บันทึกลง localStorage
  _persist: () => {
    const {
      completedEpisodes,
      currentEpisodeId,
      unlockedComponentIds,
      unlockedBlueprintChapters,
      unlockedAbilities,
      exploredMapZones,
    } = get();
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          completedEpisodes,
          currentEpisodeId,
          unlockedComponentIds,
          unlockedBlueprintChapters,
          unlockedAbilities,
          exploredMapZones,
        })
      );
    } catch (err) {
      console.warn("Could not save iot101 progress to localStorage:", err);
    }
  },

  // สำรวจจุดในแผนที่สวนเรียนรู้
  exploreMapZone: (zoneId) => {
    const { exploredMapZones } = get();
    if (!exploredMapZones.includes(zoneId)) {
      const updated = [...exploredMapZones, zoneId];
      set({ exploredMapZones: updated });
      get()._persist();
    }
  },

  // สำเร็จภารกิจ / ผ่านบทเรียน (Complete Episode)
  completeEpisode: (episodeId) => {
    const {
      completedEpisodes,
      unlockedComponentIds,
      unlockedBlueprintChapters,
      unlockedAbilities,
    } = get();

    const isNewCompletion = !completedEpisodes.includes(episodeId);
    const updatedCompleted = isNewCompletion
      ? [...completedEpisodes, episodeId]
      : completedEpisodes;

    // ตรวจสอบว่ามี Component ชนิดใดที่ปลดล็อกด้วย Episode นี้หรือไม่
    const matchingComponent = IOT_COMPONENTS.find(
      (comp) => comp.unlockEpisodeId === episodeId
    );

    let updatedComponents = [...unlockedComponentIds];
    let newUnlockedComponent = null;
    if (matchingComponent && !unlockedComponentIds.includes(matchingComponent.id)) {
      updatedComponents.push(matchingComponent.id);
      newUnlockedComponent = matchingComponent;
    }

    // ตรวจสอบการปลดล็อก Blueprint ตาม Chapter
    let updatedBlueprints = [...unlockedBlueprintChapters];
    let updatedAbilitiesList = [...unlockedAbilities];
    let newAbility = null;

    if (episodeId === "ep-1-4" && !updatedBlueprints.includes(2)) {
      updatedBlueprints.push(2);
      if (!updatedAbilitiesList.includes("ACTUATE")) {
        updatedAbilitiesList.push("ACTUATE");
        newAbility = {
          code: "ACTUATE",
          title: "การสั่งการอัตโนมัติ (Actuation)",
          desc: "ระบบสามารถควบคุมรีเลย์และปั๊มน้ำได้ตามเงื่อนไข!",
        };
      }
    } else if (episodeId === "ep-2-4" && !updatedBlueprints.includes(3)) {
      updatedBlueprints.push(3);
      if (!updatedAbilitiesList.includes("CONNECT")) {
        updatedAbilitiesList.push("CONNECT");
        newAbility = {
          code: "CONNECT",
          title: "การเชื่อมต่อไร้สาย (Connectivity)",
          desc: "ระบบสามารถส่งผ่านข้อมูลด้วย Wi-Fi และ MQTT!",
        };
      }
    } else if (episodeId === "ep-3-4" && !updatedBlueprints.includes(4)) {
      updatedBlueprints.push(4);
      if (!updatedAbilitiesList.includes("PLATFORM")) {
        updatedAbilitiesList.push("PLATFORM");
        newAbility = {
          code: "PLATFORM",
          title: "คลาวด์และแดชบอร์ด (Platform & Dashboard)",
          desc: "ระบบสามารถแสดงผลบน Dashboard และจัดเก็บฐานข้อมูล!",
        };
      }
    }

    // กำหนดข้อมูล Unlock Feedback
    let unlockInfo = null;
    if (newUnlockedComponent) {
      unlockInfo = {
        type: "component",
        title: `ปลดล็อกอุปกรณ์ใหม่: ${newUnlockedComponent.name}`,
        subtitle: newUnlockedComponent.thaiName,
        desc: newUnlockedComponent.description,
        icon: newUnlockedComponent.icon,
        category: newUnlockedComponent.category,
      };
    } else if (newAbility) {
      unlockInfo = {
        type: "ability",
        title: `ปลดล็อกความสามารถใหม่: ${newAbility.code}`,
        subtitle: newAbility.title,
        desc: newAbility.desc,
        icon: "⚡",
        category: "ความสามารถใหม่",
      };
    } else if (isNewCompletion) {
      unlockInfo = {
        type: "mission",
        title: "ภารกิจสำเร็จ!",
        subtitle: "ความก้าวหน้าของระบบเติบโตขึ้น",
        desc: "คุณได้ผ่านบทเรียนและอัปเกรดระบบในสวนเรียนรู้แห่งเมืองนาวาเรียบร้อยแล้ว",
        icon: "🎉",
        category: "สำเร็จบทเรียน",
      };
    }

    set({
      completedEpisodes: updatedCompleted,
      unlockedComponentIds: updatedComponents,
      unlockedBlueprintChapters: updatedBlueprints,
      unlockedAbilities: updatedAbilitiesList,
      latestUnlockInfo: unlockInfo,
      isUnlockModalOpen: !!unlockInfo,
    });

    get()._persist();
  },

  // ปิด Modal ความสำเร็จ
  closeUnlockModal: () => {
    set({ isUnlockModalOpen: false });
  },

  // ตรวจสอบว่า Component ปลดล็อกแล้วหรือไม่
  isComponentUnlocked: (componentId) => {
    return get().unlockedComponentIds.includes(componentId);
  },

  // ตรวจสอบว่า Chapter Blueprint ปลดล็อกแล้วหรือไม่
  isBlueprintUnlocked: (chapterNum) => {
    return get().unlockedBlueprintChapters.includes(chapterNum);
  },

  // รีเซ็ตความคืบหน้ากลับเป็นค่าเริ่มต้น
  resetProgress: () => {
    set({
      ...defaultInitialState,
      latestUnlockInfo: null,
      isUnlockModalOpen: false,
    });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to reset localStorage", e);
    }
  },
}));

export default useIoT101Store;
