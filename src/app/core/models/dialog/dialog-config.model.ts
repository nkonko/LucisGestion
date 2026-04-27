export interface DialogConfig<TData> {
  data: TData;
  width?: string;
  maxWidth?: string;
  maxHeight?: string;
  panelClass?: string;
  closeOnBackdropClick?: boolean;
}
