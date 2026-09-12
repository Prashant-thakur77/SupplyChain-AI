export interface userDataType {
    id: string;
    email: string;
    organisation_name: string;
    location: string;
    employee_count: string;
    industry: string;
    sub_industry: string;
    description: string;
  }
  
  export interface userStateType {
    userData: userDataType | null;
    userLoading: boolean;
  }
  
  export interface userActionsType {
    setUserData: () => void;
    updateUserData: (data: any) => void;
    clearUserData: () => void;
  }