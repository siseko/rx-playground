const Rx = require('rxjs');
const shareReplay = require('rxjs/operators').shareReplay;
const scan = require('rxjs/operators').scan;
const take = require('rxjs/operators').take;
const delay = require('rxjs/operators').delay;
const takeUntil = require('rxjs/operators').takeUntil;
const switchMap = require('rxjs/operators').switchMap;
const mergeMap = require('rxjs/operators').mergeMap;
const concatMap = require('rxjs/operators').concatMap;
const throttleTime = require('rxjs/operators').throttleTime;

function basic() {
  const values = Rx.Observable.create(observer => observer.next(1));

  values.subscribe(val => console.log('Val:', val));
}

function cold() {
  // or single
  // With cold observables observer function gets called on every subscribe so no sharing of values
  let val = 1;
  const values = Rx.Observable.create(observer => observer.next(val++));

  values.subscribe(val => console.log('Subscriber 1 receives:', val));
  values.subscribe(val => console.log('Subscriber 2 receives:', val));
}

function hot() {
  // or multi, often useful in multi subscriber situation
  let val = 1;
  const cold = Rx.Observable.create(observer => observer.next(val++));
  const hot = cold.pipe(shareReplay(1)); // shareReplay will cache the last '1' value as well

  hot.subscribe(val => console.log('Subscriber 1 receives:', val));
  hot.subscribe(val => console.log('Subscriber 2 receives:', val));
}

function subjects() {
  // or just use subjects which are hot
  const subject = new Rx.BehaviorSubject('Ola'); // caches the last emitted value

  subject.subscribe(val => console.log('Subscriber 1:', val));
  subject.next('Bom dia');
  subject.subscribe(val => console.log('Subscriber 2:', val));
}

function runningSumOverTime() {
  const observable = Rx.interval(1000);

  const sumObservable = observable.pipe(
    take(10),
    scan((acc, val) => acc + val)
  );

  sumObservable.subscribe(curSum => console.log(curSum));
}

function backPressure() {
  const observable = Rx.interval(100);

  const debounced = observable.pipe(
    throttleTime(1000),
    takeUntil(Rx.timer(10000)) // takeUntil timer observable emits a value, which is after 10s
  ); // we only get values every 1000ms
  // debounceTime(1000) // debounce waits for one second of SILENCE, and then it emits the most recent value
  // bufferCount(20) // collects values into an array and then emits that array only when it gets to length 20. To keep all data and only listen to it once.

  debounced.subscribe(val => console.log(val));
}

function asyncScheduler() {
  const dogs = Rx.from(['pug', 'bull terrier'], Rx.asyncScheduler);

  dogs.subscribe(dog => console.log('Petting a', dog));
}

function mappingInnerObservables() { // a few transformation techniques
  const users = Rx.from([{ id: 1 }, { id: 2 }], Rx.asyncScheduler);

  users
    .pipe(mergeMap(user => fetchPets(user.id)))
    .subscribe(pets => console.log('In pets list: ', pets));

    // switchMap only maintains one inner observable. When source (users in this case) emits, 
    // the previous inner observable is cancelled (e.g will cancel in flight network requests) and source 'switches' to new inner observable
    // if you use switchMap above you will not see values from first inner observable after source (users) emits a second time

    // mergeMap allows for multiple inner subscriptions. Beware memory leaks because of long lived inner subscriptions.
    // maybe use take, takeUntil to cancel subscriptions at relevant time. Can also specify the number of concurrent inner observables

    // concatMap just like mergeMap but emits observable values in order. 
    // concatMap waits for current inner observable to complete before subscribing to the next one
    // mergeMap subscribes to inner observables immediately 
    // in example above you will see order is not guaranteed on multiple runs but if you use concatMap it will be
}

function fetchPets(userId) {
  const pets = {
    1: ['spot', 'bobby'],
    2: ['lola', 'sir-lance-a-lot']
  };
  return Rx.from(pets[userId], Rx.asyncScheduler).pipe(delay(Math.random() * 1000));
}

function fetchHobbies(userId) {
  return Rx.from(['spot', 'bobby'], Rx.asyncScheduler);
}

basic();
// cold();
// hot();
// subjects();
// runningSumOverTime();
// backPressure();
// asyncScheduler();
// mappingInnerObservables();
console.log('EXECUTION END! (apparently)');
