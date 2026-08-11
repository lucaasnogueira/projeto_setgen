/**
 * Healthcheck da raiz da API.
 *
 * Este arquivo vinha do scaffold do Nest e falhava por dois motivos:
 * AppController nunca foi registrado no AppModule (a raiz dava 404), e o
 * `beforeEach` subia uma aplicação por teste sem nunca fechá-la — as conexões
 * do Prisma e os cron jobs ficavam abertos e o Jest não conseguia encerrar,
 * travando `npm run test:e2e` inteiro.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

jest.setTimeout(120000);

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / responde o healthcheck', async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('portal-setgen-api');
    expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('GET / não exige autenticação (a plataforma de deploy pinga sem token)', async () => {
    await request(app.getHttpServer())
      .get('/')
      .set('Authorization', '')
      .expect(200);
  });
});
