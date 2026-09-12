import { updateUserData,getUserData } from "@/utils/functions/userUtils";

export const populateUserDetails = async (set: any) => {
  set({ userLoading: true });
  const data = await getUserData();
  set({ userData: data, userLoading: false });
};

export const update_and_populate = async (set: any, data: any) => {
  set({ userLoading: true });
  await updateUserData(data);
  const updatedData = await getUserData();
  set({ userData: updatedData, userLoading: false });
};