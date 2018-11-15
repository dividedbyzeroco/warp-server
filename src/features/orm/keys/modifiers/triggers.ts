import Class from '../../class';
import { TriggerBeforeFind, TriggerBeforeFirst, TriggerBeforeGet, TriggerBeforeSave, TriggerAfterSave, TriggerBeforeDestroy, TriggerAfterDestroy } from '../../../../utils/constants';

export const beforeFind = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = classInstance.getDefinition();    
    definition.triggers = [...definition.triggers, { type: TriggerBeforeFind, action: classInstance[methodName] }];
};

export const beforeFirst = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = classInstance.getDefinition();    
    definition.triggers = [...definition.triggers, { type: TriggerBeforeFirst, action: classInstance[methodName] }];
};

export const beforeGet = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = classInstance.getDefinition();    
    definition.triggers = [...definition.triggers, { type: TriggerBeforeGet, action: classInstance[methodName] }];
};

export const beforeSave = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = classInstance.getDefinition();    
    definition.triggers = [...definition.triggers, { type: TriggerBeforeSave, action: classInstance[methodName] }];
};

export const afterSave = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = classInstance.getDefinition();    
    definition.triggers = [...definition.triggers, { type: TriggerAfterSave, action: classInstance[methodName] }];
};

export const beforeDestroy = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = classInstance.getDefinition();    
    definition.triggers = [...definition.triggers, { type: TriggerBeforeDestroy, action: classInstance[methodName] }];
};

export const afterDestroy = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = classInstance.getDefinition();    
    definition.triggers = [...definition.triggers, { type: TriggerAfterDestroy, action: classInstance[methodName] }];
};