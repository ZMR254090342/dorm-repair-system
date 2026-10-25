import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { ViewModule } from './modules/view/view.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrdersModule } from './modules/orders/orders.module';
import { StatsModule } from './modules/stats/stats.module';
import { UsersAdminModule } from './modules/users-admin/users-admin.module';

@Module({
  imports: [
    PlatformModule.forRoot(),
    AuthModule,
    OrdersModule,
    StatsModule,
    UsersAdminModule,
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
