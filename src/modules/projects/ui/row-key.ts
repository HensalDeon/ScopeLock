let counter = 0;

/** A stable React key for a repeated form row (lines, payments). */
export const rowKey = () => `row-${++counter}`;
