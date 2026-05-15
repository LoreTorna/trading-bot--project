import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SYMBOL_PROFILES,
  SUPPORTED_SYMBOLS,
  type TradingSymbol,
} from "@shared/trading";

interface SymbolSelectorProps {
  selectedSymbols: TradingSymbol[];
  onSelectionChange: (symbols: TradingSymbol[]) => void;
  disabled?: boolean;
}

export function SymbolSelector({
  selectedSymbols,
  onSelectionChange,
  disabled = false,
}: SymbolSelectorProps) {
  function toggleSymbol(symbol: TradingSymbol) {
    if (selectedSymbols.includes(symbol)) {
      onSelectionChange(selectedSymbols.filter((item) => item !== symbol));
      return;
    }

    onSelectionChange([...selectedSymbols, symbol]);
  }

  return (
    <div className="space-y-3">
      {SUPPORTED_SYMBOLS.map((symbol) => {
        const profile = SYMBOL_PROFILES[symbol];
        const checked = selectedSymbols.includes(symbol);

        return (
          <label
            key={symbol}
            className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <Checkbox
              checked={checked}
              disabled={disabled}
              onCheckedChange={() => toggleSymbol(symbol)}
            />

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{symbol}</span>
                <Badge variant="secondary">{profile.label}</Badge>
                <Badge variant="outline">{profile.market}</Badge>
                <Badge variant="outline">{profile.tradingHoursLabel}</Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {profile.description}
                </p>
                <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground md:grid-cols-3">
                  <p>
                    <span className="font-medium">Lotto default</span>: {profile.defaultLotSize}
                  </p>
                  <p>
                    <span className="font-medium">Stop loss</span>: {profile.stopLossPercent}%
                  </p>
                  <p>
                    <span className="font-medium">Take profit</span>: {profile.takeProfitPercent}%
                  </p>
                </div>
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
