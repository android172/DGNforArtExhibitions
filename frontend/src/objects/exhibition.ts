import { Parse } from './common';
import { Host } from './host';

export class Exhibition {
  constructor(
    public id: number | undefined,
    public title: string | undefined,
    public start_year: number | undefined,
    public end_year: number | undefined,
    public organizer: string | undefined,
    public type: ExhibitionType | undefined,
    public took_place_in_hosts: Host[],
  ) {}

  public static from_query(query: unknown): Exhibition[] {
    if (query === undefined) return [];
    const data = query as { exhibitions: ExhibitionRaw[] };
    if (data.exhibitions === undefined) return [];
    const exhibitions = data.exhibitions;
    return (
      exhibitions
        // Filter out nulls / NaNs
        .filter((data) => Number.isInteger(Number(data.id)))
        .map(
          (data: ExhibitionRaw) =>
            new Exhibition(
              Parse.int(data.id),
              Parse.string(data.title),
              this.parse_year(data.startdate),
              this.parse_year(data.enddate),
              Parse.string(data.organizer),
              toExhibitionType(Parse.string(data.type)),
              Parse.query({ hosts: data.tookPlaceInHosts }, Host),
            ),
        )
    );
  }

  private static parse_year(data: string): number | undefined {
    let year: number | undefined = Parse.int(data);
    if (year === undefined) return undefined;
    if (year <= 1905) return 1905;
    if (year >= 1915) return 1915;
    return year;
  }
}

interface ExhibitionRaw {
  id: string;
  title: string;
  startdate: string;
  enddate: any;
  organizer: string;
  type: string;
  tookPlaceInHosts: string;
}

export enum ExhibitionType {
  solo,
  group,
  auction,
}

const toExhibitionType = (
  value: string | undefined,
): ExhibitionType | undefined =>
  value ? ExhibitionType[value as keyof typeof ExhibitionType] : undefined;
