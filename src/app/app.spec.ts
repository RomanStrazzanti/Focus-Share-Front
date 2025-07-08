import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { App } from './app'; // Assurez-vous que c'est bien 'App' ou 'AppComponent'
import { SupabaseService } from './services/supabase.services'; // Assurez-vous du chemin correct

// --- DÉFINITION DU MOCK DU SERVICE SUPABASE ---
const mockSupabaseService = {
  auth: {
    getSession: jasmine.createSpy('getSession').and.resolveTo({ data: { session: null }, error: null }),
    onAuthStateChange: jasmine.createSpy('onAuthStateChange').and.returnValue({
      subscribe: (callback: any) => {
        callback('SIGNED_OUT', null);
        return { unsubscribe: () => {} };
      }
    }),
    signIn: jasmine.createSpy('signIn').and.resolveTo({ data: { user: { id: 'mock-user-id' } }, error: null }),
    signUp: jasmine.createSpy('signUp').and.resolveTo({ data: { user: { id: 'mock-user-id' } }, session: {}, error: null }),
    signOut: jasmine.createSpy('signOut').and.resolveTo({ error: null }),
  },
  get client() {
    const mockQueryBuilder = {
      select: jasmine.createSpy('select').and.returnValue(Promise.resolve({ data: [], error: null })),
      insert: jasmine.createSpy('insert').and.returnValue(Promise.resolve({ data: [], error: null })),
      update: jasmine.createSpy('update').and.returnValue(Promise.resolve({ data: [], error: null })),
      delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve({ data: [], error: null })),
      eq: jasmine.createSpy('eq').and.returnValue(this),
      order: jasmine.createSpy('order').and.returnValue(this),
    };
    return {
      auth: this.auth,
      from: jasmine.createSpy('from').and.returnValue(mockQueryBuilder),
      rpc: jasmine.createSpy('rpc').and.returnValue(Promise.resolve({ data: [], error: null }))
    };
  }
};
// --- FIN DE LA DÉFINITION DU MOCK ---


describe('App', () => {
  let fixture: ComponentFixture<App>;
  let app: App;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        { provide: SupabaseService, useValue: mockSupabaseService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    app = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  // Le test 'should render title' a été supprimé car app.component.html ne rend pas directement le titre
  // et la propriété 'title' du composant est protégée. Le titre est rendu par les composants routés.

  // Ajoutez d'autres tests ici si nécessaire, par exemple pour la navigation,
  // l'affichage conditionnel, etc., mais assurez-vous qu'ils reflètent le DOM *réel* ou les interactions de service.
});
