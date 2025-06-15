import { makeAutoObservable, runInAction } from "mobx";
import { AuthStore } from "./AuthStore";
interface CalendarEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  backgroundColor?: string;
  dosage: number;
}

export interface DrugSchedule {
  name_drug: string;
  dosage: number;
  frequency: number;
  interval: number;
  description: string;
  start_datetime: string;
  end_datetime: string;
  start_schedule: string;
  is_active: boolean;
}

const baseURL = import.meta.env.VITE_BACKEND_URL;

class CalendarStore {
  events: CalendarEvent[] = [];
  loading: boolean = false;
  error: string | null = null;
  authStore: AuthStore;

  constructor(authStore: AuthStore) {
    this.authStore = authStore;
    makeAutoObservable(this);
  }

  // Функция для загрузки событий
  async fetchEvents() {
    this.loading = true;
    this.error = null;

    try {
      const user_id = JSON.parse(sessionStorage.getItem("user") || "{}").id;
      const response = await fetch(`${baseURL}/schedules/user/${user_id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.authStore.access_token}`,
        },
      });
      const data = await response.json();

      if (data) {
        const events: CalendarEvent[] = [];
        const seenStarts = new Set<string>();
        data.forEach((entry: any) => {
          const {
            id,
            name_drug,
            start_datetime,
            end_datetime,
            schedule_times,
          } = entry;

          events.push({
            id: `${id}_course`,
            title: `Курс: ${name_drug}`,
            start_date: start_datetime,
            end_date: end_datetime,
            dosage: entry.dosage,
          });

          schedule_times?.forEach((day: any) => {
            day.appointments?.forEach((appointment: any, index: number) => {
              const key = `${appointment.start}-${id}`;
              if (!seenStarts.has(key)) {
                seenStarts.add(key);
                events.push({
                  id: `${id}_${day.date}_${index}`,
                  title: name_drug,
                  start_date: appointment.start,
                  end_date: appointment.end,
                  backgroundColor: appointment.done ? "green" : "gray",
                  dosage: entry.dosage,
                });
              }
            });
          });
        });
        runInAction(() => {
          this.events = events;
        });
      }
    } catch (e) {
      runInAction(() => {
        this.error = "Ошибка при загрузке данных.";
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  // Функция для добавления нового события
  async AddScheduleEvent(event: DrugSchedule) {
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      const response = await fetch(`${baseURL}/schedules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.authStore.access_token}`,
        },
        body: JSON.stringify({ ...event, user_id: user.id }),
      });

      if (response.ok) {
        const newEvent = await response.json();
        runInAction(() => {
          this.events.push(newEvent); // Добавляем новое событие в список
        });
      } else {
        throw new Error("Не удалось добавить событие");
      }
    } catch (e) {
      runInAction(() => {
        this.error = "Ошибка при добавлении события.";
      });
    }
  }
}

export { CalendarStore };
