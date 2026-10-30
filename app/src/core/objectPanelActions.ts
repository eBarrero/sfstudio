import objectPanelState from '../store/objectPanelState';

export const OBJECT_PANEL_ACTION = {
  SHOW_FIELDS: 'object.show_fields',
  SHOW_RELATIONS: 'object.show_relations',
} as const;

export type ObjectPanelActionId = typeof OBJECT_PANEL_ACTION[keyof typeof OBJECT_PANEL_ACTION];

export function dispatchObjectPanelAction(actionId: ObjectPanelActionId): void {
  objectPanelState.getState().selectTab(
    actionId === OBJECT_PANEL_ACTION.SHOW_FIELDS ? 'fields' : 'relations',
  );
}
