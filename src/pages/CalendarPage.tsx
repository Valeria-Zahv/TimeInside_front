import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import ruLocale from "@fullcalendar/core/locales/ru";
import { PlusCircle } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useStores } from "../stores/useStores";
import AddScheduleModal from "../components/AddScheduleModal/AddScheduleModal ";
import { CustomSelect } from "../components/CustomSelect";

const getResponsiveView = (width: number) => {
  if (width < 480) return "listWeek";
  return "dayGridMonth";
};

const CalendarPage = observer(() => {
  const { calendarStore } = useStores();
  const calendarRef = useRef<FullCalendar | null>(null);
  const [currentView, setCurrentView] = useState(
    getResponsiveView(window.innerWidth),
  );
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isManualView, setIsManualView] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [calendarKey, setCalendarKey] = useState(0);
  const [showCalendar, setShowCalendar] = useState(true);

  const [visibleDate, setVisibleDate] = useState(new Date());
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setLoading(false);
    const handleResize = () => {
      if (isManualView) return;
      const newView = getResponsiveView(window.innerWidth);
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi && newView !== currentView) {
        calendarApi.changeView(newView);
        setCurrentView(newView);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calendarStore, currentView, isManualView]);

  const events = calendarStore.events.map((event) => {
    // Добавляем 3 часа (в миллисекундах) к датам
    const adjustedStart = new Date(
      new Date(event.start_date).getTime() + 3 * 60 * 60 * 1000,
    );
    const adjustedEnd = new Date(
      new Date(event.end_date).getTime() + 3 * 60 * 60 * 1000,
    );

    return {
      id: String(event.id),
      title: event.title,
      start: adjustedStart.toISOString(),
      end: adjustedEnd.toISOString(),
      backgroundColor: event.backgroundColor || undefined,
      dosage: event.dosage,
    };
  });

  const animateCalendarRefresh = () => {
    setShowCalendar(false);
    setTimeout(() => {
      setCalendarKey((prev) => prev + 1);
      setShowCalendar(true);
    }, 300);
  };

  // Исправленная функция навигации
  const navigateCalendar = (offset: number) => {
    if (animating) return;

    const current = new Date(visibleDate);
    const next = new Date(current);

    if (offset === 0) {
      // Переход на сегодня
      next.setTime(new Date().getTime());
    } else {
      // Навигация в зависимости от текущего вида
      if (currentView === "dayGridMonth") {
        // Для месячного вида - переходим на месяц вперед/назад
        next.setMonth(current.getMonth() + offset);
      } else if (currentView === "listWeek" || currentView.includes("Week")) {
        // Для недельного вида - переходим на неделю вперед/назад
        next.setDate(current.getDate() + offset * 7);
      } else {
        // Для дневного вида - переходим на день вперед/назад
        next.setDate(current.getDate() + offset);
      }
    }

    setDirection(offset < 0 ? "left" : "right");
    setAnimating(true);

    setShowCalendar(false);

    setTimeout(() => {
      setVisibleDate(next);
      setShowCalendar(true);
      setAnimating(false);
    }, 300);
  };

  const handleViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newView = e.target.value;
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(newView);
      setCurrentView(newView);
      setIsManualView(true);
      animateCalendarRefresh();
    }
  };

  // Функция для получения текста кнопок в зависимости от вида
  const getNavigationLabels = () => {
    switch (currentView) {
      case "dayGridMonth":
        return { prev: "← Предыдущий месяц", next: "Следующий месяц →" };
      case "listWeek":
        return { prev: "← Предыдущая неделя", next: "Следующая неделя →" };
      default:
        return { prev: "← Назад", next: "Вперёд →" };
    }
  };

  const navLabels = getNavigationLabels();

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 min-h-[400px] overflow-hidden">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
          <span className="loader"></span>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-6 mb-6">
            {/* Навигация */}
            <div className="flex gap-3">
              <button
                className="px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-100 active:scale-95 transition flex items-center gap-1 text-gray-700 disabled:opacity-50"
                onClick={() => navigateCalendar(-1)}
                disabled={animating}
              >
                {navLabels.prev}
              </button>
              <button
                className="px-4 py-2 bg-green-300 text-white rounded-xl shadow-sm hover:bg-green-400 active:scale-95 transition font-semibold disabled:opacity-50"
                onClick={() => navigateCalendar(0)}
                disabled={animating}
              >
                Сегодня
              </button>
              <button
                className="px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-100 active:scale-95 transition flex items-center gap-1 text-gray-700 disabled:opacity-50"
                onClick={() => navigateCalendar(1)}
                disabled={animating}
              >
                {navLabels.next}
              </button>
            </div>

            {/* Вид отображения */}
            <CustomSelect
              label="Вид:"
              value={currentView}
              onChange={(val) =>
                handleViewChange({ target: { value: val } } as any)
              }
            />

            {/* Кнопка добавления */}
            <div>
              <button
                onClick={() => {
                  const now = new Date(); // Текущая дата и время
                  const futureDate = new Date(
                    now.getTime() + 3 * 60 * 60 * 1000,
                  ); // Добавляем 3 часа

                  setSelectedDate(futureDate);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all transform hover:scale-105"
              >
                <PlusCircle size={20} />
                Добавить приём
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {showCalendar && visibleDate && (
              <motion.div
                key={`${visibleDate.toISOString()}-${currentView}`}
                initial={{ opacity: 0, x: direction === "right" ? 100 : -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction === "right" ? -100 : 100 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <FullCalendar
                  key={calendarKey}
                  ref={calendarRef}
                  plugins={[
                    dayGridPlugin,
                    timeGridPlugin,
                    interactionPlugin,
                    listPlugin,
                  ]}
                  initialDate={visibleDate}
                  initialView={currentView}
                  headerToolbar={false}
                  titleFormat={{ month: "short", day: "numeric" }}
                  eventTimeFormat={undefined}
                  events={events}
                  locales={[ruLocale]}
                  locale={ruLocale}
                  eventClick={(info) => {
                    if ((window as any).Telegram?.WebApp) {
                      try {
                        (window as any).Telegram.WebApp.showAlert(
                          `Препарат: ${
                            info.event.title
                          }\nВремя приема: ${info.event.start
                            ?.toISOString()
                            .slice(11, 16)}\nДозировка: ${
                            info.event.extendedProps.dosage
                          } мг`,
                        );
                      } catch (error) {
                        alert(
                          `Препарат: ${
                            info.event.title
                          }\nВремя приема: ${info.event.start?.getHours()}:${info.event.start?.getMinutes()}\nДозировка: ${
                            info.event.extendedProps.dosage
                          } мг`,
                        );
                      }
                    }
                  }}
                  dateClick={(info) => {
                    setSelectedDate(new Date(info.dateStr));
                    setShowModal(true);
                  }}
                  dayMaxEvents={3}
                  timeZone="local"
                  nowIndicator={true}
                  height="auto"
                  aspectRatio={3.0}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {showModal && selectedDate && (
            <AddScheduleModal
              show={showModal}
              onClose={() => setShowModal(false)}
              ceil_info={selectedDate}
            />
          )}
        </>
      )}
    </div>
  );
});

export default CalendarPage;
