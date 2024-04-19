export class Parse {
    static int = (val: any): number | undefined => this.parse_par(val, parseInt);
    static float = (val: any): number | undefined => this.parse_par(val, parseFloat);
    static date = (val: any): Date | undefined => this.parse_new(val, Date);
    static string = (val: any): string | undefined => this.nn(val);

    static query<T extends LocalObj>(val: any, c: any): T[] {
        const TT: LocalObjBuilder<T> = c as LocalObjBuilder<T>;
        return TT.from_query(val)
            // Remove duplicates
            .reduce((acc: T[], host: T) =>
                acc.some(h => h.id === host.id) ? acc : [...acc, host],
                [] as T[]
            );
    };

    private static nn = (val: any) => val === "\\N" ? undefined : val;
    private static parse_par = (val: any, par: any) => val ? par(this.nn(val)) : undefined;
    private static parse_new = (val: any, dty: any) => val ? new dty(this.nn(val)) : undefined;
}

interface LocalObj {
    id: number | undefined
}
interface LocalObjBuilder<T extends LocalObj> {
    new(): LocalObj
    from_query: (query: any) => any[]
}