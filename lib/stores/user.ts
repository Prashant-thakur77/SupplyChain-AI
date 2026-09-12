import { create } from 'zustand';

import { userDataType, userStateType, userActionsType } from '../types/user';
import { populateUserDetails, update_and_populate } from '../actions/user';

const userState: userStateType = {
  userData: null,
  userLoading: false,
};
export const useUser = create<userActionsType & userStateType>((set) => ({
  ...userState,
  setUserData: () => populateUserDetails(set),
  clearUserData: () => set({ userData: null, userLoading: false }),
  updateUserData: (data: any) => update_and_populate(set, data),
  // Write other reducers with proper actions like above.
}));