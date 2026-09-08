/** Parameter order is instance_id, then the optional recorded-time cutoff. */
export function versionSelection(asOf?: string): string {
  if (asOf === undefined) return 'SELECT instance_id,id,revision,document FROM records WHERE instance_id=?';
  return `SELECT instance_id,id,revision,document FROM (
    SELECT h.*,row_number() OVER (PARTITION BY h.id ORDER BY h.rowid DESC) AS position
    FROM history h WHERE h.instance_id=? AND mcc_timestamp(json_extract(h.document,'$.updated_at'))<=?
  ) WHERE position=1`;
}
export const versionArguments = (instance: string, asOf?: string): (string | number)[] => asOf === undefined ? [instance] : [instance, Date.parse(asOf)];
