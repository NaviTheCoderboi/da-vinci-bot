/**
 * Represents an Event
 */
export default class Event {
    name: string;
    once: boolean;
    execute: (...args: any) => Promise<void> | void | any;

    constructor(object: {
        name: string;
        once?: boolean;
        execute: (...args: any) => Promise<void> | void | any;
    }) {
        this.name = object.name;
        this.once = object.once ?? false;
        this.execute = object.execute;
    }
}
