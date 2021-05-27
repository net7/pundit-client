/*
 *ngFor="let c of oneDimArray | sortBy:'asc'"
 *ngFor="let c of arrayOfObjects | sortBy:'asc':'propertyName'"
*/
import { Pipe, PipeTransform } from '@angular/core';
import { orderBy } from 'lodash';

@Pipe({ name: 'sortBy' })
export class SortByPipe implements PipeTransform {
  transform(value: any[], order = '', column = ''): any[] {
    if (!value || order === '' || !order) { return value; } // no array
    if (value.length <= 1) { return value; } // array with only one item
    if (!column || column === '') {
      if (order === 'asc') { return value.sort(); }
      return value.sort().reverse();
    } // sort 1d array
    const iterFun = (val) => (val[column] && typeof val[column] === 'string' ? val[column].toLowerCase() : column);
    return orderBy(value, [iterFun], [order as boolean | 'asc' | 'desc']);
  }
}
