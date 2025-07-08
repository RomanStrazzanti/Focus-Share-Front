import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagesComponent } from './messages';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SupabaseService } from '../services/supabase.services';

// Ce mock doit simuler toutes les méthodes de SupabaseService utilisées par votre composant/service testé.
const mockSupabaseService = {
  auth: {
    getSession: jasmine.createSpy('getSession').and.resolveTo({ data: { session: null }, error: null }),
    onAuthStateChange: jasmine.createSpy('onAuthStateChange').and.returnValue({
      subscribe: (callback: any) => {
        callback('SIGNED_OUT', null); // Simule un état déconnecté par défaut
        return { unsubscribe: () => {} }; // Fournit une méthode unsubscribe vide
      }
    }),
    signInWithPassword: jasmine.createSpy('signInWithPassword').and.resolveTo({ user: { id: 'mock-user-id' }, session: {}, error: null }),
    signUp: jasmine.createSpy('signUp').and.resolveTo({ user: { id: 'mock-user-id' }, session: {}, error: null }),
    signOut: jasmine.createSpy('signOut').and.resolveTo({ error: null }),
  },
  client: { // Ajoutez cette partie si vos composants/services interagissent avec la base de données Supabase
    from: jasmine.createSpy('from').and.returnValue({
      select: jasmine.createSpy('select').and.returnValue(Promise.resolve({ data: [], error: null })),
      insert: jasmine.createSpy('insert').and.returnValue(Promise.resolve({ data: [], error: null })),
      update: jasmine.createSpy('update').and.returnValue(Promise.resolve({ data: [], error: null })),
      delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve({ data: [], error: null })),
    }),
    rpc: jasmine.createSpy('rpc').and.returnValue(Promise.resolve({ data: [], error: null }))
  }
};

describe('Messages', () => {
  let component: MessagesComponent;
  let fixture: ComponentFixture<MessagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessagesComponent, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
