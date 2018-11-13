import Class from '../../class';
import { TriggerBeforeFind, TriggerBeforeFirst, TriggerBeforeGet, TriggerBeforeSave, TriggerAfterSave, TriggerBeforeDestroy, TriggerAfterDestroy } from '../../../../utils/constants';

export const BeforeFind = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = classInstance.getDefinition();    
    definition.triggers = [...definition.triggers, { type: TriggerBeforeFind, action: classInstance[methodName] }];
};

export const BeforeFirst = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = classInstance.getDefinition();    
    definition.triggers = [...definition.triggers, { type: TriggerBeforeFirst, action: classInstance[methodName] }];
};

export const BeforeGet = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = classInstance.getDefinition();    
    definition.triggers = [...definition.triggers, { type: TriggerBeforeGet, action: classInstance[methodName] }];
};

export const BeforeSave = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = classInstance.getDefinition();    
    definition.triggers = [...definition.triggers, { type: TriggerBeforeSave, action: classInstance[methodName] }];
};

export const AfterSave = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = classInstance.getDefinition();    
    definition.triggers = [...definition.triggers, { type: TriggerAfterSave, action: classInstance[methodName] }];
};

export const BeforeDestroy = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = classInstance.getDefinition();    
    definition.triggers = [...definition.triggers, { type: TriggerBeforeDestroy, action: classInstance[methodName] }];
};

export const AfterDestroy = <C extends Class>(classInstance: C, methodName: string) => {
    // Add method to triggers
    const definition = classInstance.getDefinition();    
    definition.triggers = [...definition.triggers, { type: TriggerAfterDestroy, action: classInstance[methodName] }];
};