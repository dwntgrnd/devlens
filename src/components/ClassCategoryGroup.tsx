'use client';

import { ClassChip } from './ClassChip';
import type { ClassConflict } from '../core/class-conflict-detection';
import { getChipConflicts } from '../core/class-conflict-detection';

interface ClassCategoryGroupProps {
  category: string;
  classes: string[];
  originalClasses: string[];
  onUpdate: (oldClass: string, newClass: string) => void;
  onRemove: (className: string) => void;
  conflicts?: ClassConflict[];
}

export function ClassCategoryGroup({
  category,
  classes,
  originalClasses,
  onUpdate,
  onRemove,
  conflicts = [],
}: ClassCategoryGroupProps) {
  // Check if any class in this group has conflicts
  const hasConflict = conflicts.length > 0 && classes.some(
    (cls) => getChipConflicts(cls, conflicts) !== undefined
  );

  return (
    <div className="te-class-group">
      <div className="te-class-group-header">
        <span>
          {category}
          {hasConflict && (
            <span className="te-conflict-warning" title="Conflicting classes in this group">
              {' '}⚠
            </span>
          )}
        </span>
      </div>
      <div className="te-class-chips">
        {classes.map((cls) => (
          <ClassChip
            key={cls}
            className={cls}
            isModified={!originalClasses.includes(cls)}
            onUpdate={onUpdate}
            onRemove={onRemove}
            conflict={getChipConflicts(cls, conflicts)}
          />
        ))}
      </div>
    </div>
  );
}
