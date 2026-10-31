import objectPanelState from '../store/objectPanelState';

export const OBJECT_PANEL_ACTION = {
  SHOW_FIELDS: 'object.show_fields',
  SHOW_RELATIONS: 'object.show_relations',
  SHOW_WHERE: 'object.show_where',
} as const;

export type ObjectPanelActionId = typeof OBJECT_PANEL_ACTION[keyof typeof OBJECT_PANEL_ACTION];

export function dispatchObjectPanelAction(actionId: ObjectPanelActionId): void {
  const tabs = {
    [OBJECT_PANEL_ACTION.SHOW_FIELDS]: 'fields',
    [OBJECT_PANEL_ACTION.SHOW_RELATIONS]: 'relations',
    [OBJECT_PANEL_ACTION.SHOW_WHERE]: 'where',
  } as const;
  objectPanelState.getState().selectTab(tabs[actionId]);
}
