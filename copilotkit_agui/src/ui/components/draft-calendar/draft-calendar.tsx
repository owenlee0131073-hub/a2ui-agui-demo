"use client";

import { type CSSProperties, type PointerEvent, useState } from "react";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import type { BusinessTripWorkspaceAction } from "@/business-trip/actions";
import type { DraftPlanState } from "@/business-trip/state";
import { Badge } from "@/ui/primitives/badge";
import styles from "./draft-calendar.module.css";

const hourHeight = 64;
const defaultStartHour = 7;
const defaultEndHour = 22;

type ItineraryItem = DraftPlanState["itinerary"][number];
type EventCategory = ItineraryItem["category"];

type CalendarItem = ItineraryItem & {
  sourceIndex: number;
  splitIndex: number;
};

type CalendarDay = {
  key: string;
  day: string;
  date: string | null;
  weekday: string;
  dayNumber: string;
  caption: string;
  originalIndex: number;
  items: CalendarItem[];
};

type TimedEvent = CalendarItem & {
  startMinutes: number;
  endMinutes: number;
};

type CalendarInteraction = {
  mode: "move" | "resize";
  pointerId: number;
  sourceIndex: number;
  splitIndex: number;
  startY: number;
  originalStartMinutes: number;
  originalEndMinutes: number;
  nextStartMinutes: number;
  nextEndMinutes: number;
  title: string;
  day: string;
  date: string | null | undefined;
};

type DraftCalendarProps = {
  actionDisabled?: boolean;
  draftPlan: DraftPlanState;
  onWorkspaceAction?: (action: BusinessTripWorkspaceAction) => Promise<void>;
};

const categoryLabels: Record<EventCategory, string> = {
  travel: "이동",
  meeting: "미팅",
  work: "업무",
  meal: "식사",
  lodging: "숙소",
  buffer: "버퍼",
};

const categoryClassNames: Record<EventCategory, string> = {
  travel: styles.eventTravel,
  meeting: styles.eventMeeting,
  work: styles.eventWork,
  meal: styles.eventMeal,
  lodging: styles.eventLodging,
  buffer: styles.eventBuffer,
};

export function DraftCalendar({
  actionDisabled = false,
  draftPlan,
  onWorkspaceAction,
}: DraftCalendarProps) {
  const [interaction, setInteraction] = useState<CalendarInteraction | null>(
    null,
  );
  const calendarItems = draftPlan.itinerary.flatMap(expandItineraryItem);
  const days = buildCalendarDays(calendarItems);
  const timedEvents = days.flatMap((day) =>
    day.items
      .map((item) => toTimedEvent(item))
      .filter((event): event is TimedEvent => Boolean(event)),
  );

  const startHour = clampHour(
    Math.min(
      draftPlan.calendarStartHour ?? defaultStartHour,
      ...timedEvents.map((event) => Math.floor(event.startMinutes / 60)),
    ),
    defaultStartHour,
  );
  const endHour = clampEndHour(
    Math.max(
      draftPlan.calendarEndHour ?? defaultEndHour,
      ...timedEvents.map((event) => Math.ceil(event.endMinutes / 60)),
    ),
    defaultEndHour,
  );
  const hours = Array.from({ length: endHour - startHour }, (_, index) => {
    return startHour + index;
  });
  const boardStyle = {
    "--day-count": Math.max(days.length, 1),
    "--timeline-height": `${hours.length * hourHeight}px`,
    "--hour-height": `${hourHeight}px`,
  } as CSSProperties;

  const beginInteraction = (
    pointerEvent: PointerEvent<HTMLElement>,
    event: TimedEvent,
    mode: CalendarInteraction["mode"],
  ) => {
    if (actionDisabled || !onWorkspaceAction || event.splitIndex !== 0) {
      return;
    }

    pointerEvent.preventDefault();
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
    setInteraction({
      mode,
      pointerId: pointerEvent.pointerId,
      sourceIndex: event.sourceIndex,
      splitIndex: event.splitIndex,
      startY: pointerEvent.clientY,
      originalStartMinutes: event.startMinutes,
      originalEndMinutes: event.endMinutes,
      nextStartMinutes: event.startMinutes,
      nextEndMinutes: event.endMinutes,
      title: event.title,
      day: event.day,
      date: event.date,
    });
  };

  const handlePointerMove = (pointerEvent: PointerEvent<HTMLElement>) => {
    if (!interaction || interaction.pointerId !== pointerEvent.pointerId) {
      return;
    }

    pointerEvent.preventDefault();
    setInteraction(
      resolveInteraction(interaction, pointerEvent.clientY, startHour, endHour),
    );
  };

  const finishInteraction = (pointerEvent: PointerEvent<HTMLElement>) => {
    if (!interaction || interaction.pointerId !== pointerEvent.pointerId) {
      return;
    }

    pointerEvent.preventDefault();

    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }

    const resolvedInteraction = resolveInteraction(
      interaction,
      pointerEvent.clientY,
      startHour,
      endHour,
    );
    setInteraction(null);

    if (
      resolvedInteraction.nextStartMinutes ===
        resolvedInteraction.originalStartMinutes &&
      resolvedInteraction.nextEndMinutes === resolvedInteraction.originalEndMinutes
    ) {
      return;
    }

    void onWorkspaceAction?.({
      source: "workspace_component",
      action: "edit_draft_event",
      stage: "draft",
      payload: {
        eventIndex: resolvedInteraction.sourceIndex,
        title: resolvedInteraction.title,
        day: resolvedInteraction.day,
        date: resolvedInteraction.date,
        startTime: minutesToTime(resolvedInteraction.nextStartMinutes),
        endTime: minutesToTime(resolvedInteraction.nextEndMinutes),
      },
    });
  };

  const cancelInteraction = (pointerEvent: PointerEvent<HTMLElement>) => {
    if (!interaction || interaction.pointerId !== pointerEvent.pointerId) {
      return;
    }

    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }

    setInteraction(null);
  };

  return (
    <section className={styles.calendar} aria-label="일정 초안 캘린더">
      <header className={styles.calendarHeader}>
        <div className={styles.headerTitle}>
          <CalendarDays size={18} aria-hidden="true" />
          <span>Daily Calendar</span>
        </div>
        <div className={styles.headerMeta}>
          <Badge variant="secondary">초안</Badge>
          <span>{draftPlan.timezone || "GMT+09"}</span>
        </div>
      </header>

      <div className={styles.calendarScroll}>
        <div className={styles.calendarGrid} style={boardStyle}>
          <div className={styles.timezoneCell}>{draftPlan.timezone || "GMT+09"}</div>
          {days.map((day) => (
            <div key={day.key} className={styles.dayHeader}>
              <strong>{day.caption}</strong>
            </div>
          ))}

          <div className={styles.allDayLabel}>미정</div>
          {days.map((day) => (
            <div key={`${day.key}-floating`} className={styles.allDayCell}>
              {day.items.filter((item) => !toTimedEvent(item)).map((item) => (
                <span
                  key={`${item.sourceIndex}-${item.splitIndex}`}
                  className={styles.floatingEvent}
                >
                  {item.title}
                </span>
              ))}
            </div>
          ))}

          <div className={styles.timeRail}>
            {hours.map((hour) => (
              <div key={hour} className={styles.timeSlot}>
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {days.map((day) => (
            <div
              key={`${day.key}-column`}
              className={styles.dayColumn}
              style={{ minHeight: `var(--timeline-height)` }}
            >
              {day.items
                .map((item) => toTimedEvent(item))
                .filter((event): event is TimedEvent => Boolean(event))
                .map((event) => {
                  const visibleEvent = applyInteractionPreview(event, interaction);
                  const top =
                    ((visibleEvent.startMinutes - startHour * 60) / 60) *
                    hourHeight;
                  const height = Math.max(
                    ((visibleEvent.endMinutes - visibleEvent.startMinutes) / 60) *
                      hourHeight -
                      8,
                    42,
                  );
                  const isCompact = height < 58;
                  const isEditable =
                    Boolean(onWorkspaceAction) &&
                    !actionDisabled &&
                    event.splitIndex === 0;
                  const isInteracting =
                    interaction?.sourceIndex === event.sourceIndex &&
                    interaction.splitIndex === event.splitIndex;

                  return (
                    <article
                      key={`${event.sourceIndex}-${event.splitIndex}`}
                      className={`${styles.eventBlock} ${
                        categoryClassNames[event.category]
                      } ${isCompact ? styles.eventCompact : ""} ${
                        isEditable ? styles.eventEditable : styles.eventReadOnly
                      } ${isInteracting ? styles.eventDragging : ""}`}
                      style={{ top: `${top}px`, height: `${height}px` }}
                      aria-label={`${event.title} 일정`}
                      onPointerCancel={cancelInteraction}
                      onPointerDown={(pointerEvent) =>
                        beginInteraction(pointerEvent, visibleEvent, "move")
                      }
                      onPointerMove={handlePointerMove}
                      onPointerUp={finishInteraction}
                    >
                      <div className={styles.eventMeta}>
                        <span>
                          <Clock3 size={13} aria-hidden="true" />
                          {formatTimeRange(
                            visibleEvent.startTime,
                            visibleEvent.endTime,
                          )}
                        </span>
                        <Badge variant="outline">
                          {categoryLabels[event.category]}
                        </Badge>
                      </div>
                      <h3>{event.title}</h3>
                      <p>{event.detail}</p>
                      {event.location ? (
                        <span className={styles.location}>
                          <MapPin size={13} aria-hidden="true" />
                          {event.location}
                        </span>
                      ) : null}
                      {isEditable ? (
                        <button
                          type="button"
                          className={styles.resizeHandle}
                          aria-label={`${event.title} 종료 시간 조정`}
                          onPointerDown={(pointerEvent) => {
                            pointerEvent.stopPropagation();
                            beginInteraction(pointerEvent, visibleEvent, "resize");
                          }}
                        />
                      ) : null}
                    </article>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function applyInteractionPreview(
  event: TimedEvent,
  interaction: CalendarInteraction | null,
): TimedEvent {
  if (
    !interaction ||
    interaction.sourceIndex !== event.sourceIndex ||
    interaction.splitIndex !== event.splitIndex
  ) {
    return event;
  }

  return {
    ...event,
    startMinutes: interaction.nextStartMinutes,
    endMinutes: interaction.nextEndMinutes,
    startTime: minutesToTime(interaction.nextStartMinutes),
    endTime: minutesToTime(interaction.nextEndMinutes),
  };
}

function resolveInteraction(
  interaction: CalendarInteraction,
  clientY: number,
  startHour: number,
  endHour: number,
): CalendarInteraction {
  const deltaMinutes = snapMinutes(
    ((clientY - interaction.startY) / hourHeight) * 60,
  );
  const minMinutes = startHour * 60;
  const maxMinutes = endHour * 60;

  if (interaction.mode === "resize") {
    const nextEndMinutes = clampMinutes(
      snapMinutes(interaction.originalEndMinutes + deltaMinutes),
      interaction.originalStartMinutes + 30,
      maxMinutes,
    );

    return {
      ...interaction,
      nextEndMinutes,
      nextStartMinutes: interaction.originalStartMinutes,
    };
  }

  const duration = interaction.originalEndMinutes - interaction.originalStartMinutes;
  const nextStartMinutes = clampMinutes(
    snapMinutes(interaction.originalStartMinutes + deltaMinutes),
    minMinutes,
    maxMinutes - duration,
  );

  return {
    ...interaction,
    nextStartMinutes,
    nextEndMinutes: nextStartMinutes + duration,
  };
}

function snapMinutes(value: number) {
  return Math.round(value / 30) * 30;
}

function clampMinutes(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function minutesToTime(value: number) {
  const boundedValue = clampMinutes(value, 0, 23 * 60 + 59);
  const hour = Math.floor(boundedValue / 60);
  const minute = boundedValue % 60;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function expandItineraryItem(item: ItineraryItem, sourceIndex: number) {
  if (toTimedEvent({ ...item, sourceIndex, splitIndex: 0 })) {
    return [{ ...item, sourceIndex, splitIndex: 0 }];
  }

  const matches = Array.from(
    item.detail.matchAll(
      /(\d{1,2}:\d{2})\s*[~\-–—]\s*(\d{1,2}:\d{2})\s*([^.;\n]*)/g,
    ),
  );

  if (matches.length === 0) {
    return [{ ...item, sourceIndex, splitIndex: 0 }];
  }

  return matches.map((match, splitIndex) => {
    const title = cleanSegmentTitle(match[3]) || item.title;

    return {
      ...item,
      title,
      detail: item.title,
      startTime: normalizeTime(match[1]),
      endTime: normalizeTime(match[2]),
      category: inferCategory(title),
      sourceIndex,
      splitIndex,
    };
  });
}

function buildCalendarDays(items: CalendarItem[]) {
  const days = new Map<string, CalendarDay>();

  items.forEach((item, itemIndex) => {
    const date = item.date ?? extractIsoDate(item.day);
    const key = date ?? item.day;

    if (!days.has(key)) {
      const parts = date ? formatDateParts(date) : null;
      days.set(key, {
        key,
        day: item.day,
        date,
        weekday: parts?.weekday ?? item.weekday ?? `DAY ${itemIndex + 1}`,
        dayNumber: parts?.dayNumber ?? String(itemIndex + 1),
        caption: parts?.caption ?? item.day,
        originalIndex: itemIndex,
        items: [],
      });
    }

    days.get(key)?.items.push(item);
  });

  return Array.from(days.values()).sort((left, right) => {
    if (left.date && right.date) {
      return left.date.localeCompare(right.date);
    }

    return left.originalIndex - right.originalIndex;
  });
}

function toTimedEvent(item: CalendarItem): TimedEvent | null {
  const startMinutes = minutesFromTime(item.startTime);
  const endMinutes = minutesFromTime(item.endTime);

  if (startMinutes == null || endMinutes == null || endMinutes <= startMinutes) {
    return null;
  }

  return {
    ...item,
    startMinutes,
    endMinutes,
  };
}

function minutesFromTime(value: string | null | undefined) {
  const normalized = normalizeTime(value);

  if (!normalized) {
    return null;
  }

  const [hour, minute] = normalized.split(":").map(Number);
  return hour * 60 + minute;
}

function normalizeTime(value: string | null | undefined) {
  const match = value?.trim().match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function extractIsoDate(value: string) {
  return value.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
}

function formatDateParts(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return {
    weekday: new Intl.DateTimeFormat("ko-KR", { weekday: "short" })
      .format(parsedDate)
      .toUpperCase(),
    dayNumber: String(parsedDate.getDate()),
    caption: `${parsedDate.getMonth() + 1}.${parsedDate.getDate()}`,
  };
}

function formatHour(hour: number) {
  if (hour === 0) {
    return "12 AM";
  }

  if (hour < 12) {
    return `${hour} AM`;
  }

  if (hour === 12) {
    return "12 PM";
  }

  return `${hour - 12} PM`;
}

function formatTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
) {
  return `${normalizeTime(startTime) ?? "--:--"}-${normalizeTime(endTime) ?? "--:--"}`;
}

function cleanSegmentTitle(value: string | undefined) {
  return value
    ?.replace(/^[\s,.:;·-]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferCategory(text: string): EventCategory {
  if (/KTX|SRT|공항|비행|택시|이동|도착|귀가|출발/.test(text)) {
    return "travel";
  }

  if (/호텔|숙소|체크인|체크아웃|휴식|복귀/.test(text)) {
    return "lodging";
  }

  if (/조식|점심|저녁|식사|식당/.test(text)) {
    return "meal";
  }

  if (/회의|미팅|논의|질의|견적|검토|데모|시연/.test(text)) {
    return "meeting";
  }

  if (/대기|버퍼|준비|정비/.test(text)) {
    return "buffer";
  }

  return "work";
}

function clampHour(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(23, Math.floor(value)));
}

function clampEndHour(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.min(24, Math.ceil(value)));
}
