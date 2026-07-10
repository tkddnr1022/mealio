import type { Provider, Type } from '@nestjs/common';
import { KafkaModule } from '../../integrations/kafka/kafka.module';
import { KafkaProducerService } from '../../integrations/kafka/kafka-producer.service';
import { NoOpKafkaProducerService } from '../../integrations/kafka/kafka-producer.noop.service';

export interface RecipeIngestionKafkaModuleOptions {
  noKafka?: boolean;
}

export function recipeIngestionKafkaImports(
  options: RecipeIngestionKafkaModuleOptions,
): Array<Type<unknown>> {
  return options.noKafka ? [] : [KafkaModule];
}

export function recipeIngestionKafkaProviders(
  options: RecipeIngestionKafkaModuleOptions,
): Provider[] {
  if (!options.noKafka) {
    return [];
  }
  return [
    {
      provide: KafkaProducerService,
      useClass: NoOpKafkaProducerService,
    },
  ];
}
