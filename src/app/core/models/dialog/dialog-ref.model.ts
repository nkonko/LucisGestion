import { Observable, Subject } from 'rxjs';

export class DialogRef<TResult> {
  private readonly closeSubject = new Subject<TResult | undefined>();

  readonly afterClosed: Observable<TResult | undefined> = this.closeSubject.asObservable();

  close(result?: TResult): void {
    this.closeSubject.next(result);
    this.closeSubject.complete();
  }
}
