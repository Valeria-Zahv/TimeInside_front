import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { observer } from "mobx-react-lite";
import { useStores } from "../../stores/useStores";
import { PlusCircle, Loader2, AlertCircle } from "lucide-react";
import type { DrugSchedule } from "../../stores/CalendarStore";

const AddScheduleModal = observer(
  ({
    show,
    onClose,
    ceil_info,
  }: {
    show: boolean;
    onClose: () => void;
    ceil_info: Date;
  }) => {
    const { drugStore, calendarStore } = useStores();
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingDrugs, setLoadingDrugs] = useState(false);
    const [drugsError, setDrugsError] = useState<string | null>(null);

    const [form, setForm] = useState<DrugSchedule>({
      name_drug: "",
      dosage: 0,
      frequency: 1,
      interval: 24,
      description: "",
      start_datetime: ceil_info.toISOString(),
      end_datetime: ceil_info.toISOString(),
      start_schedule: "",
      is_active: true,
    });
    const [preNotifyHours, setPreNotifyHours] = useState<number>(0);

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({
        ...form,
        start_datetime: e.target.value,
        start_schedule: e.target.value.slice(11, 16), // безопасно получаем HH:mm
      });
    };
    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({
        ...form,
        end_datetime: e.target.value, // Конвертируем только end_datetime
      });
    };

    const adjustToUTC = (dateStr: string) => {
      const date = new Date(dateStr);
      return new Date(date.getTime() + 0 * 60 * 60 * 1000).toISOString();
    };

    const handleSubmit = async () => {
      try {
        // Функция для вычитания 3 часов из времени в формате HH:mm
        const subtractHoursFromTime = (
          timeString: string,
          hoursToSubtract: number,
        ) => {
          const [hours, minutes] = timeString.split(":").map(Number);
          let totalMinutes = hours * 60 + minutes;
          totalMinutes -= hoursToSubtract * 60;

          // Обработка перехода через полночь
          if (totalMinutes < 0) {
            totalMinutes += 24 * 60;
          }

          const newHours = Math.floor(totalMinutes / 60) % 24;
          const newMinutes = totalMinutes % 60;

          return `${String(newHours).padStart(2, "0")}:${String(
            newMinutes,
          ).padStart(2, "0")}`;
        };

        // Вычитаем 3 часа из start_schedule
        const adjustedStartSchedule = form.start_schedule
          ? subtractHoursFromTime(form.start_schedule, 3)
          : "";

        const payload = {
          ...form,
          start_datetime: adjustToUTC(form.start_datetime),
          end_datetime: adjustToUTC(form.end_datetime),
          start_schedule: adjustedStartSchedule, // Используем скорректированное время
        };

        await calendarStore.AddScheduleEvent(payload);
        await calendarStore.fetchEvents();
        onClose();
      } catch (e) {
        alert("Ошибка при добавлении курса приёма" + JSON.stringify(e));
      }
    };

    useEffect(() => {
      const loadDrugs = async () => {
        try {
          setLoadingDrugs(true);
          setDrugsError(null);
          await drugStore.fetchDrugs();
        } catch (error) {
          console.error("Ошибка при загрузке списка лекарств:", error);
          setDrugsError(
            "Не удалось загрузить список лекарств. Попробуйте позже.",
          );
        } finally {
          setLoadingDrugs(false);
        }
      };

      if (show) {
        loadDrugs();
      }
    }, [show, drugStore]);

    return (
      <AnimatePresence>
        {show && (
          <motion.div className="fixed inset-0 z-50 flex items-center backdrop-blur-sm   justify-center">
            <motion.div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-lg">
              <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">
                Добавить курс приёма
              </h2>
              <div className="space-y-4">
                <div className="flex flex-col relative">
                  <label className="text-sm font-medium text-gray-600">
                    Название лекарства
                  </label>
                  <input
                    type="text"
                    placeholder="Введите название лекарства"
                    className="input"
                    value={form.name_drug}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm({ ...form, name_drug: value });
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => {
                      // Делаем задержку, чтобы успеть нажать на подсказку
                      setTimeout(() => setShowSuggestions(false), 150);
                    }}
                  />
                  {showSuggestions && form.name_drug && (
                    <ul className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded shadow z-10 max-h-48 overflow-y-auto">
                      {loadingDrugs ? (
                        <li className="px-3 py-2 text-gray-500 flex items-center justify-center">
                          <Loader2 className="animate-spin mr-2" size={16} />
                          Загрузка...
                        </li>
                      ) : drugsError ? (
                        <li className="px-3 py-2 text-red-500 flex items-center">
                          <AlertCircle className="mr-2" size={16} />
                          {drugsError}
                        </li>
                      ) : (
                        (Array.isArray(drugStore.drugs) ? drugStore.drugs : [])
                          .filter((drug) =>
                            drug?.name
                              ?.toLowerCase()
                              .includes(form.name_drug.toLowerCase()),
                          )
                          .map((drug) => (
                            <li
                              key={drug.id}
                              className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                              onClick={() => {
                                setForm({
                                  ...form,
                                  name_drug: drug.name,
                                  dosage: drug.dosage,
                                  frequency: drug.frequency,
                                  interval: drug.interval,
                                  description: drug.description,
                                });
                                setShowSuggestions(false);
                              }}
                            >
                              {drug.name}
                            </li>
                          ))
                      )}
                    </ul>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-600">
                    Дозировка
                  </label>
                  <input
                    type="number"
                    placeholder="Введите дозировку"
                    className="input"
                    value={form.dosage}
                    onChange={(e) =>
                      setForm({ ...form, dosage: +e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-600">
                    Частота (в день)
                  </label>
                  <input
                    type="number"
                    placeholder="Введите частоту"
                    className="input"
                    value={form.frequency}
                    onChange={(e) =>
                      setForm({ ...form, frequency: +e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-600">
                    Интервал (часы)
                  </label>
                  <input
                    type="number"
                    placeholder="Введите интервал (часы)"
                    className="input"
                    value={form.interval}
                    onChange={(e) =>
                      setForm({ ...form, interval: +e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-600">
                    Описание
                  </label>
                  <textarea
                    placeholder="Введите описание"
                    className="input"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-600">
                    Время начала
                  </label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={form.start_datetime.slice(0, 16)}
                    onChange={handleStartDateChange}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-600">
                    Уведомить за (часы)
                  </label>
                  <input
                    type="number"
                    placeholder="Введите количество часов для предварительного уведомления"
                    className="input"
                    value={preNotifyHours}
                    onChange={(e) => setPreNotifyHours(Number(e.target.value))}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-600">
                    Время первого приема
                  </label>
                  <input
                    type="time"
                    className="input mb-2"
                    value={form.start_schedule}
                    onChange={(e) =>
                      setForm({ ...form, start_schedule: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-600">
                    Время окончания
                  </label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={form.end_datetime.slice(0, 16)}
                    onChange={handleEndDateChange}
                  />
                </div>

                <div className="flex  mt-10 justify-between gap-4">
                  <button
                    onClick={onClose}
                    // className="btn w-full bg-gray-300 text-gray-800 hover:bg-gray-400"
                    className="items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-gray-300 hover:text-black text-white transition transform hover:scale-105"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition transform hover:scale-105"
                  >
                    <PlusCircle size={18} />
                    Добавить
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  },
);

export default AddScheduleModal;
