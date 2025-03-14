/**
 * Base class for all commands
 * @abstract
 */
export default abstract class BaseCommand {
    name: string;
    description: string;
    execute: (...args: any) => Promise<void> | void | any;
    help: string;

    constructor(object: {
        name: string;
        description: string;
        execute: (...args: any) => Promise<void> | void | any;
        help: string;
    }) {
        this.name = object.name;
        this.description = object.description;
        this.execute = object.execute;
        this.help = object.help;
    }

    /**
     * @param {string} name - The name
     */
    setName(name: string): void {
        this.name = name;
    }

    /**
     * @param {string} description - The description
     */
    setDescription(description: string): void {
        this.description = description;
    }

    /**
     * @param {(...args: any) => Promise<void> | void} executeFunction - The function
     */
    setExecute(executeFunction: (...args: any) => Promise<void> | void): void {
        this.execute = executeFunction;
    }
}
