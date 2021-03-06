import * as React from 'react';
import { Link } from 'office-ui-fabric-react/lib/Link';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import {
  IContextualMenuProps,
  IContextualMenuItem,
  DirectionalHint,
  ContextualMenu
} from 'office-ui-fabric-react/lib/ContextualMenu';
import {
  CheckboxVisibility,
  ColumnActionsMode,
  ConstrainMode,
  DetailsList,
  DetailsListLayoutMode as LayoutMode,
  IColumn,
  IGroup,
  Selection,
  SelectionMode,
  buildColumns
} from 'office-ui-fabric-react/lib/DetailsList';
import { createListItems, isGroupable } from 'office-ui-fabric-react/lib/utilities/exampleData';
import './DetailsList.Advanced.Example.scss';

const DEFAULT_ITEM_LIMIT = 5;
const PAGING_SIZE = 10;
const PAGING_DELAY = 5000;
const ITEMS_COUNT = 5000;

let _items: any;

export interface IDetailsListAdvancedExampleState {
  canResizeColumns?: boolean;
  checkboxVisibility?: CheckboxVisibility;
  columns?: IColumn[];
  constrainMode?: ConstrainMode;
  contextualMenuProps?: IContextualMenuProps;
  groupItemLimit?: number;
  groups?: IGroup[];
  isHeaderVisible?: boolean;
  isLazyLoaded?: boolean;
  isSortedDescending?: boolean;
  items?: any[];
  layoutMode?: LayoutMode;
  selectionMode?: SelectionMode;
  sortedColumnKey?: string;
}

export class DetailsListAdvancedExample extends React.Component<{}, IDetailsListAdvancedExampleState> {
  private _isFetchingItems: boolean;
  private _selection: Selection;

  constructor(props: {}) {
    super(props);

    if (!_items) {
      _items = createListItems(ITEMS_COUNT);
    }

    this._selection = new Selection();
    this._selection.setItems(_items, false);

    this.state = {
      items: _items,
      groups: undefined,
      groupItemLimit: DEFAULT_ITEM_LIMIT,
      layoutMode: LayoutMode.justified,
      constrainMode: ConstrainMode.horizontalConstrained,
      selectionMode: SelectionMode.multiple,
      canResizeColumns: true,
      checkboxVisibility: CheckboxVisibility.onHover,
      columns: this._buildColumns(
        _items,
        true,
        this._onColumnClick,
        '',
        undefined,
        undefined,
        this._onColumnContextMenu
      ),
      contextualMenuProps: undefined,
      sortedColumnKey: 'name',
      isSortedDescending: false,
      isLazyLoaded: false,
      isHeaderVisible: true
    };
  }

  public render(): JSX.Element {
    const {
      checkboxVisibility,
      columns,
      constrainMode,
      contextualMenuProps,
      groupItemLimit,
      groups,
      isHeaderVisible,
      items,
      layoutMode,
      selectionMode
    } = this.state;

    const isGrouped = groups && groups.length > 0;
    const groupProps = {
      getGroupItemLimit: (group: IGroup) => {
        if (group) {
          return group.isShowingAll ? group.count : Math.min(group.count, groupItemLimit as number);
        } else {
          return items!.length;
        }
      },
      footerProps: {
        showAllLinkText: 'Show all'
      }
    };

    return (
      <div className="ms-DetailsListAdvancedExample">
        <CommandBar items={this._getCommandItems()} />

        {isGrouped ? <TextField label="Group Item Limit" onChange={this._onItemLimitChanged} /> : null}

        <DetailsList
          setKey="items"
          items={items as any[]}
          groups={groups}
          columns={columns}
          checkboxVisibility={checkboxVisibility}
          layoutMode={layoutMode}
          isHeaderVisible={isHeaderVisible}
          selectionMode={selectionMode}
          constrainMode={constrainMode}
          groupProps={groupProps}
          enterModalSelectionOnTouch={true}
          onItemInvoked={this._onItemInvoked}
          onItemContextMenu={this._onItemContextMenu}
          ariaLabelForListHeader="Column headers. Use menus to perform column operations like sort and filter"
          ariaLabelForSelectAllCheckbox="Toggle selection for all items"
          ariaLabelForSelectionColumn="Toggle selection"
          onRenderMissingItem={this._onRenderMissingItem}
          useReducedRowRenderer={true}
        />

        {contextualMenuProps && <ContextualMenu {...contextualMenuProps} />}
      </div>
    );
  }

  private _onDataMiss(index: number): void {
    index = Math.floor(index / PAGING_SIZE) * PAGING_SIZE;

    if (!this._isFetchingItems) {
      this._isFetchingItems = true;

      setTimeout(() => {
        this._isFetchingItems = false;
        const itemsCopy = ([] as any[]).concat(this.state.items);

        itemsCopy.splice.apply(itemsCopy, [index, PAGING_SIZE].concat(_items.slice(index, index + PAGING_SIZE)));

        this.setState({
          items: itemsCopy
        });
      }, PAGING_DELAY);
    }
  }

  private _onRenderMissingItem = (index: number): null => {
    this._onDataMiss(index as number);
    return null;
  };

  private _onToggleLazyLoad = (): void => {
    let { isLazyLoaded } = this.state;

    isLazyLoaded = !isLazyLoaded;

    this.setState({
      isLazyLoaded: isLazyLoaded,
      items: isLazyLoaded ? _items.slice(0, PAGING_SIZE).concat(new Array(ITEMS_COUNT - PAGING_SIZE)) : _items
    });
  };

  private _onToggleResizing = (): void => {
    const { items, sortedColumnKey, isSortedDescending } = this.state;
    let { canResizeColumns } = this.state;

    canResizeColumns = !canResizeColumns;

    this.setState({
      canResizeColumns: canResizeColumns,
      columns: this._buildColumns(
        items as any[],
        canResizeColumns,
        this._onColumnClick,
        sortedColumnKey,
        isSortedDescending
      )
    });
  };

  private _onLayoutChanged = (ev: React.MouseEvent<HTMLElement>, menuItem: IContextualMenuItem): void => {
    this.setState({
      layoutMode: menuItem.data
    });
  };

  private _onConstrainModeChanged = (ev: React.MouseEvent<HTMLElement>, menuItem: IContextualMenuItem): void => {
    this.setState({
      constrainMode: menuItem.data
    });
  };

  private _onSelectionChanged = (ev: React.MouseEvent<HTMLElement>, menuItem: IContextualMenuItem): void => {
    this.setState({
      selectionMode: menuItem.data
    });
  };

  private _onItemLimitChanged = (ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value: string): void => {
    let newValue = parseInt(value, 10);
    if (isNaN(newValue)) {
      newValue = DEFAULT_ITEM_LIMIT;
    }
    this.setState({
      groupItemLimit: newValue
    });
  };

  private _getCommandItems = (): IContextualMenuItem[] => {
    const {
      canResizeColumns,
      checkboxVisibility,
      constrainMode,
      isHeaderVisible,
      isLazyLoaded,
      layoutMode,
      selectionMode
    } = this.state;

    return [
      {
        key: 'addRow',
        text: 'Insert row',
        iconProps: { iconName: 'Add' },
        onClick: this._onAddRow
      },
      {
        key: 'deleteRow',
        text: 'Delete row',
        iconProps: { iconName: 'Delete' },
        onClick: this._onDeleteRow
      },
      {
        key: 'configure',
        text: 'Configure',
        iconProps: { iconName: 'Settings' },
        subMenuProps: {
          items: [
            {
              key: 'resizing',
              text: 'Allow column resizing',
              canCheck: true,
              checked: canResizeColumns,
              onClick: this._onToggleResizing
            },
            {
              key: 'headerVisible',
              text: 'Is header visible',
              canCheck: true,
              checked: isHeaderVisible,
              onClick: () => this.setState({ isHeaderVisible: !isHeaderVisible })
            },
            {
              key: 'lazyload',
              text: 'Simulate async loading',
              canCheck: true,
              checked: isLazyLoaded,
              onClick: this._onToggleLazyLoad
            },
            {
              key: 'dash',
              text: '-'
            },
            {
              key: 'checkboxVisibility',
              text: 'Checkbox visibility',
              subMenuProps: {
                items: [
                  {
                    key: 'checkboxVisibility.always',
                    text: 'Always',
                    canCheck: true,
                    isChecked: checkboxVisibility === CheckboxVisibility.always,
                    onClick: () => this.setState({ checkboxVisibility: CheckboxVisibility.always })
                  },
                  {
                    key: 'checkboxVisibility.onHover',
                    text: 'On hover',
                    canCheck: true,
                    isChecked: checkboxVisibility === CheckboxVisibility.onHover,
                    onClick: () => this.setState({ checkboxVisibility: CheckboxVisibility.onHover })
                  },
                  {
                    key: 'checkboxVisibility.hidden',
                    text: 'Hidden',
                    canCheck: true,
                    isChecked: checkboxVisibility === CheckboxVisibility.hidden,
                    onClick: () => this.setState({ checkboxVisibility: CheckboxVisibility.hidden })
                  }
                ]
              }
            },
            {
              key: 'layoutMode',
              text: 'Layout mode',
              subMenuProps: {
                items: [
                  {
                    key: LayoutMode[LayoutMode.fixedColumns],
                    text: 'Fixed columns',
                    canCheck: true,
                    checked: layoutMode === LayoutMode.fixedColumns,
                    onClick: this._onLayoutChanged,
                    data: LayoutMode.fixedColumns
                  },
                  {
                    key: LayoutMode[LayoutMode.justified],
                    text: 'Justified columns',
                    canCheck: true,
                    checked: layoutMode === LayoutMode.justified,
                    onClick: this._onLayoutChanged,
                    data: LayoutMode.justified
                  }
                ]
              }
            },
            {
              key: 'selectionMode',
              text: 'Selection mode',
              subMenuProps: {
                items: [
                  {
                    key: SelectionMode[SelectionMode.none],
                    text: 'None',
                    canCheck: true,
                    checked: selectionMode === SelectionMode.none,
                    onClick: this._onSelectionChanged,
                    data: SelectionMode.none
                  },
                  {
                    key: SelectionMode[SelectionMode.single],
                    text: 'Single select',
                    canCheck: true,
                    checked: selectionMode === SelectionMode.single,
                    onClick: this._onSelectionChanged,
                    data: SelectionMode.single
                  },
                  {
                    key: SelectionMode[SelectionMode.multiple],
                    text: 'Multi select',
                    canCheck: true,
                    checked: selectionMode === SelectionMode.multiple,
                    onClick: this._onSelectionChanged,
                    data: SelectionMode.multiple
                  }
                ]
              }
            },
            {
              key: 'constrainMode',
              text: 'Constrain mode',
              subMenuProps: {
                items: [
                  {
                    key: ConstrainMode[ConstrainMode.unconstrained],
                    text: 'Unconstrained',
                    canCheck: true,
                    checked: constrainMode === ConstrainMode.unconstrained,
                    onClick: this._onConstrainModeChanged,
                    data: ConstrainMode.unconstrained
                  },
                  {
                    key: ConstrainMode[ConstrainMode.horizontalConstrained],
                    text: 'Horizontal constrained',
                    canCheck: true,
                    checked: constrainMode === ConstrainMode.horizontalConstrained,
                    onClick: this._onConstrainModeChanged,
                    data: ConstrainMode.horizontalConstrained
                  }
                ]
              }
            }
          ]
        }
      }
    ];
  };

  private _getContextualMenuProps(ev: React.MouseEvent<HTMLElement>, column: IColumn): IContextualMenuProps {
    const items = [
      {
        key: 'aToZ',
        name: 'A to Z',
        iconProps: { iconName: 'SortUp' },
        canCheck: true,
        checked: column.isSorted && !column.isSortedDescending,
        onClick: () => this._onSortColumn(column.key, false)
      },
      {
        key: 'zToA',
        name: 'Z to A',
        iconProps: { iconName: 'SortDown' },
        canCheck: true,
        checked: column.isSorted && column.isSortedDescending,
        onClick: () => this._onSortColumn(column.key, true)
      }
    ];
    if (isGroupable(column.key)) {
      items.push({
        key: 'groupBy',
        name: 'Group By ' + column.name,
        iconProps: { iconName: 'GroupedDescending' },
        canCheck: true,
        checked: column.isGrouped,
        onClick: () => this._onGroupByColumn(column)
      });
    }
    return {
      items: items,
      target: ev.currentTarget as HTMLElement,
      directionalHint: DirectionalHint.bottomLeftEdge,
      gapSpace: 10,
      isBeakVisible: true,
      onDismiss: this._onContextualMenuDismissed
    };
  }

  private _onItemInvoked = (item: any, index: number): void => {
    console.log('Item invoked', item, index);
  };

  private _onItemContextMenu = (item: any, index: number, ev: MouseEvent): boolean => {
    if ((ev.target as HTMLElement).nodeName === 'A') {
      return true;
    }
    console.log('Item context menu invoked', item, index);
    return false;
  };

  private _onColumnClick = (ev: React.MouseEvent<HTMLElement>, column: IColumn): void => {
    if (column.columnActionsMode !== ColumnActionsMode.disabled) {
      this.setState({
        contextualMenuProps: this._getContextualMenuProps(ev, column)
      });
    }
  };

  private _onColumnContextMenu = (column: IColumn, ev: React.MouseEvent<HTMLElement>): void => {
    if (column.columnActionsMode !== ColumnActionsMode.disabled) {
      this.setState({
        contextualMenuProps: this._getContextualMenuProps(ev, column)
      });
    }
  };

  private _onContextualMenuDismissed = (): void => {
    this.setState({
      contextualMenuProps: undefined
    });
  };

  private _onSortColumn = (key: string, isSortedDescending: boolean): void => {
    const sortedItems = _items
      .slice(0)
      .sort((a: any, b: any) => ((isSortedDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1));

    this.setState({
      items: sortedItems,
      groups: undefined,
      columns: this._buildColumns(
        sortedItems,
        true,
        this._onColumnClick,
        key,
        isSortedDescending,
        undefined,
        this._onColumnContextMenu
      ),
      isSortedDescending: isSortedDescending,
      sortedColumnKey: key
    });
  };

  private _onGroupByColumn = (column: IColumn): void => {
    const { key, isGrouped } = column;
    const { sortedColumnKey, isSortedDescending, groups, items, columns } = this.state;

    if (isGrouped) {
      // ungroup
      this._onSortColumn(sortedColumnKey as string, !!isSortedDescending);
    } else {
      let groupedItems = [];
      let newGroups = null;
      if (groups) {
        newGroups = groups.concat([]);
        groupedItems = this._groupByKey(newGroups, items as any[], key);
      } else {
        groupedItems = this._groupItems(items as any[], key);
        newGroups = this._getGroups(groupedItems, key);
      }

      const newColumns = columns as IColumn[];
      newColumns.filter(matchColumn => matchColumn.key === key).forEach((groupedColumn: IColumn) => {
        groupedColumn.isGrouped = true;
      });
      this.setState({
        items: groupedItems,
        columns: newColumns,
        groups: newGroups
      });
    }
  };

  private _groupByKey(groups: IGroup[], items: any[], key: string): any[] {
    let groupedItems: any[] = [];
    if (groups) {
      groups.forEach((group: IGroup) => {
        if (group.children && group.children.length > 0) {
          const childGroupedItems = this._groupByKey(group.children, items, key);
          groupedItems = groupedItems.concat(childGroupedItems);
        } else {
          const itemsInGroup = items.slice(group.startIndex, group.startIndex + group.count);
          const nextLevelGroupedItems = this._groupItems(itemsInGroup, key);
          groupedItems = groupedItems.concat(nextLevelGroupedItems);
          group.children = this._getGroups(nextLevelGroupedItems, key, group);
        }
      });
    }
    return groupedItems;
  }

  private _groupItems(items: any[], columnKey: string): any[] {
    return items.slice(0).sort((a, b) => (a[columnKey] < b[columnKey] ? -1 : 1));
  }

  private _getGroups(groupedItems: any[], key: string, parentGroup?: IGroup): IGroup[] {
    const separator = '-';
    const groups = groupedItems.reduce((current, item, index) => {
      const currentGroup = current[current.length - 1];

      if (!currentGroup || this._getLeafGroupKey(currentGroup.key, separator) !== item[key]) {
        current.push({
          key: (parentGroup ? parentGroup.key + separator : '') + item[key],
          name: key + ': ' + item[key],
          startIndex: parentGroup ? parentGroup.startIndex + index : index,
          count: 1,
          level: parentGroup ? parentGroup.level! + 1 : 0
        });
      } else {
        currentGroup.count++;
      }
      return current;
    }, []);

    return groups;
  }

  private _getLeafGroupKey(key: string, separator: string): string {
    let leafKey = key;
    if (key.indexOf(separator) !== -1) {
      const arrKeys = key.split(separator);
      leafKey = arrKeys[arrKeys.length - 1];
    }
    return leafKey;
  }

  private _onAddRow = (): void => {
    this.setState({
      items: createListItems(1).concat(this.state.items)
    });
  };

  private _onDeleteRow = (): void => {
    this.setState({
      items: this.state.items!.slice(1)
    });
  };

  private _buildColumns(
    items: any[],
    canResizeColumns?: boolean,
    onColumnClick?: (ev: React.MouseEvent<HTMLElement>, column: IColumn) => any,
    sortedColumnKey?: string,
    isSortedDescending?: boolean,
    groupedColumnKey?: string,
    onColumnContextMenu?: (column: IColumn, ev: React.MouseEvent<HTMLElement>) => any
  ) {
    const columns = buildColumns(
      items,
      canResizeColumns,
      onColumnClick,
      sortedColumnKey,
      isSortedDescending,
      groupedColumnKey
    );

    columns.forEach(column => {
      column.onColumnContextMenu = onColumnContextMenu;
      column.ariaLabel = `Operations for ${column.name}`;
      if (column.key === 'thumbnail') {
        column.iconName = 'Picture';
        column.isIconOnly = true;
      } else if (column.key === 'description') {
        column.isMultiline = true;
        column.minWidth = 200;
      } else if (column.key === 'name') {
        column.onRender = item => <Link data-selection-invoke={true}>{item.name}</Link>;
      } else if (column.key === 'key') {
        column.columnActionsMode = ColumnActionsMode.disabled;
        column.onRender = item => (
          <Link href="https://microsoft.com" target="_blank" rel="noopener">
            {item.key}
          </Link>
        );
        column.minWidth = 90;
        column.maxWidth = 90;
      }
    });

    return columns;
  }
}
