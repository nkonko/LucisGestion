import { Observable, ReplaySubject } from 'rxjs';

export class DialogRef<TResult> {
  private readonly closeSubject = new ReplaySubject<TResult | undefined>(1);

  readonly afterClosed: Observable<TResult | undefined> = this.closeSubject.asObservable();

  close(result?: TResult): void {
    this.closeSubject.next(result);
    this.closeSubject.complete();
  }
}
