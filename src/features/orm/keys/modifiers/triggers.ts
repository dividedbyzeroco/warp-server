import Class, { ClassDefinitionManager } from '../../class';
import { TriggerBeforeFind, TriggerBeforeFirst, TriggerBeforeGet, TriggerBeforeSave, TriggerAfterSave, TriggerBeforeDestroy, TriggerAfterDestroy } from '../../../../utils/constants';

export const beforeFind = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = ClassDefinitionManager.get(classInstance.statics());
    definition.triggers = [...definition.triggers, { type: TriggerBeforeFind, action: classInstance[methodName] }];
    ClassDefinitionManager.set(classInstance.statics(), definition);
};

export const beforeFirst = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = ClassDefinitionManager.get(classInstance.statics());
    definition.triggers = [...definition.triggers, { type: TriggerBeforeFirst, action: classInstance[methodName] }];
    ClassDefinitionManager.set(classInstance.statics(), definition);
};

export const beforeGet = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = ClassDefinitionManager.get(classInstance.statics());
    definition.triggers = [...definition.triggers, { type: TriggerBeforeGet, action: classInstance[methodName] }];
    ClassDefinitionManager.set(classInstance.statics(), definition);
};

export const beforeSave = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = ClassDefinitionManager.get(classInstance.statics());
    definition.triggers = [...definition.triggers, { type: TriggerBeforeSave, action: classInstance[methodName] }];
    ClassDefinitionManager.set(classInstance.statics(), definition);
};

export const afterSave = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = ClassDefinitionManager.get(classInstance.statics());
    definition.triggers = [...definition.triggers, { type: TriggerAfterSave, action: classInstance[methodName] }];
    ClassDefinitionManager.set(classInstance.statics(), definition);
};

export const beforeDestroy = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = ClassDefinitionManager.get(classInstance.statics());
    definition.triggers = [...definition.triggers, { type: TriggerBeforeDestroy, action: classInstance[methodName] }];
    ClassDefinitionManager.set(classInstance.statics(), definition);
};

export const afterDestroy = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = ClassDefinitionManager.get(classInstance.statics());
    definition.triggers = [...definition.triggers, { type: TriggerAfterDestroy, action: classInstance[methodName] }];
    ClassDefinitionManager.set(classInstance.statics(), definition);
};