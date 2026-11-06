/**
 * Activity module: public, client-safe API.
 */
export {
  describeActivity,
  isClientVisible,
  type ActivityActor,
  type ActivityEvent,
  type ActivityType,
} from "./domain/activity";
export { ActivityTimeline } from "./ui/activity-timeline";
