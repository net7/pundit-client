import { DataSource } from '@n7-frontend/core';

export class DummyDS extends DataSource {
  transform(data) {
    return data;
  }
}
