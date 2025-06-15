import { AuthStore } from "./AuthStore";
import { DrugStore } from "./DrugStore";
import { CalendarStore } from "./CalendarStore";

const authStore = new AuthStore();
const drugStore = new DrugStore(authStore);
const calendarStore = new CalendarStore(authStore);

export const stores = {
  authStore,
  drugStore,
  calendarStore,
};

export type StoresType = typeof stores;
