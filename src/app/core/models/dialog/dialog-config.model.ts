export interface DialogConfig<TData> {
  data: TData;
  title?: string;
  width?: string;
  maxWidth?: string;
  maxHeight?: string;
  panelClass?: string;
  closeOnBackdropClick?: boolean;
}
