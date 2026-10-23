import React from 'react';

const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' };
const JUSTIFY = { left: 'justify-start', center: 'justify-center', right: 'justify-end' };

// Estilos dos botões de ação na tabela (desktop)
const TABLE_ACTION = {
  primary: 'text-[#FFCA18] hover:bg-[#FFCA18]/10',
  success: 'text-green-400 hover:bg-green-400/10',
  danger: 'text-[#4A5578] hover:text-red-500 hover:bg-red-500/10',
  neutral: 'text-[#8F9BB3] hover:text-white hover:bg-[#1B1F3B]',
  info: 'bg-[#1B1F3B] hover:bg-[#2A2F55] border border-[#2A2F55] text-sky-400 shadow',
};

// Estilos dos botões de ação nos cards (celular)
const CARD_ACTION = {
  primary: 'text-[#FFCA18] border-[#FFCA18]/30 hover:bg-[#FFCA18]/10',
  success: 'text-green-400 border-green-400/30 hover:bg-green-400/10',
  danger: 'text-red-400 border-red-500/30 hover:bg-red-500/10',
  neutral: 'text-[#8F9BB3] border-[#2A2F55] hover:bg-[#111535]',
  info: 'bg-[#111535] border-[#2A2F55] text-sky-400 hover:bg-[#2A2F55]',
};

/**
 * columns: [{ key, header, render?(row, index), align?, textClassName?,
 *   primary? (título do card), badge? (topo direito do card),
 *   cardLabel?, cardFull?, hideOnCard? }]
 * actions: array ou função (row, index) => [{ label, icon, onClick, variant, iconOnly }]
 */
export default function ResponsiveTable({
  columns,
  data = [],
  rowKey = 'id',
  actions,
  actionsHeader = 'Ações',
  actionsAlign = 'right',
  loading = false,
  loadingMessage = 'Carregando...',
  emptyMessage = 'Nenhum registro encontrado.',
  cardCols = 2,
  className = '',
  headerClassName = 'bg-[#1B1F3B] text-[#8F9BB3]',
  cardClassName = 'bg-[#1B1F3B] border border-[#2A2F55]',
}) {
  if (loading) {
    return <div className="p-10 text-center text-[#8F9BB3]">{loadingMessage}</div>;
  }

  if (!data || data.length === 0) {
    return <div className="p-10 text-center text-[#8F9BB3]">{emptyMessage}</div>;
  }

  const primary = columns.find((c) => c.primary) || columns[0];
  const badge = columns.find((c) => c.badge);
  const fields = columns.filter((c) => c !== primary && c !== badge && !c.hideOnCard);

  const getKey = (row, index) => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    return row[rowKey] ?? index;
  };
  const getActions = (row, index) => {
    if (!actions) return [];
    const list = typeof actions === 'function' ? actions(row, index) : actions;
    return (list || []).filter(Boolean);
  };
  const renderCell = (col, row, index) => (col.render ? col.render(row, index) : row[col.key]);

  const cardGrid = cardCols === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2';

  return (
    <div className={className}>
      {/* Celular: cards empilhados */}
      <div className="md:hidden p-3 space-y-3">
        {data.map((row, index) => {
          const rowActions = getActions(row, index);
          return (
            <article key={getKey(row, index)} className={`rounded-xl p-4 ${cardClassName}`}>
              <div className="flex items-start justify-between gap-3">
                <div className={`min-w-0 flex-1 break-words font-bold ${primary.textClassName || 'text-white'}`}>
                  {renderCell(primary, row, index)}
                </div>
                {badge && (
                  <div className="shrink-0 whitespace-nowrap">{renderCell(badge, row, index)}</div>
                )}
              </div>

              {fields.length > 0 && (
                <dl className={`mt-4 grid ${cardGrid} gap-x-4 gap-y-3`}>
                  {fields.map((col) => (
                    <div key={col.key} className={`min-w-0 ${col.cardFull ? 'col-span-full' : ''}`}>
                      <dt className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest mb-1">
                        {col.cardLabel || col.header}
                      </dt>
                      <dd className={`text-sm break-words ${col.textClassName || 'text-white'}`}>
                        {renderCell(col, row, index)}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {rowActions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#2A2F55] flex gap-2">
                  {rowActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.label}
                        type="button"
                        onClick={action.onClick}
                        className={`flex-1 min-w-0 min-h-[44px] px-3 rounded-xl border text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${CARD_ACTION[action.variant || 'neutral']}`}
                      >
                        {Icon && <Icon size={18} className="shrink-0" />}
                        <span className="truncate">{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Tablet e desktop: tabela */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className={headerClassName}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 lg:px-6 py-4 font-bold ${ALIGN[col.align || 'left']}`}
                >
                  {col.header}
                </th>
              ))}
              {actions && (
                <th className={`px-4 lg:px-6 py-4 font-bold ${ALIGN[actionsAlign]}`}>{actionsHeader}</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2F55]">
            {data.map((row, index) => {
              const rowActions = getActions(row, index);
              return (
                <tr key={getKey(row, index)} className="hover:bg-[#1B1F3B]/50 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 lg:px-6 py-4 min-w-0 break-words align-middle ${ALIGN[col.align || 'left']} ${col.textClassName || 'text-white'}`}
                    >
                      {renderCell(col, row, index)}
                    </td>
                  ))}
                  {actions && (
                    <td className={`px-4 lg:px-6 py-4 align-middle ${ALIGN[actionsAlign]}`}>
                      <div className={`flex items-center gap-2 ${JUSTIFY[actionsAlign]}`}>
                        {rowActions.map((action) => {
                          const Icon = action.icon;
                          return (
                            <button
                              key={action.label}
                              type="button"
                              onClick={action.onClick}
                              title={action.label}
                              aria-label={action.label}
                              className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                                action.iconOnly
                                  ? 'p-2 rounded-lg'
                                  : 'px-3 py-2 rounded-xl text-xs font-bold'
                              } ${TABLE_ACTION[action.variant || 'neutral']}`}
                            >
                              {Icon && <Icon size={action.iconOnly ? 18 : 14} />}
                              {!action.iconOnly && action.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
