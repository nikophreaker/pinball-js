import { Plugins, Scene, Events } from "phaser";
import { CollidingObject as CO } from "./valid-collision-object";
import { CollideABConfig as ABConfig, Unsubscribe, CollideAConfig as AConfig, RemoveCollideConfigA as RemoveAConfig, RemoveCollideConfigAB as RemoveABConfig } from "./collision-types";
/**
 * @export
 */
export default class MatterCollisionPlugin extends Plugins.ScenePlugin {
    protected scene: Scene;
    protected pluginManager: Plugins.PluginManager;
    events: Events.EventEmitter;
    private collisionStartListeners;
    private collisionEndListeners;
    private collisionActiveListeners;
    constructor(scene: Scene, pluginManager: Plugins.PluginManager, pluginKey: string);
    /**
     * Add a listener for collidestart events between objectA and objectB. The collidestart event is
     * fired by Matter when two bodies start colliding within a tick of the engine. If objectB is
     * omitted, any collisions with objectA will be passed along to the listener. See
     * {@link paircollisionstart} for information on callback parameters.
     */
    addOnCollideStart<T extends CO, K extends CO>(config: ABConfig<T, K>): Unsubscribe;
    addOnCollideStart<T extends CO>(config: AConfig<T>): Unsubscribe;
    /** This method mirrors {@link MatterCollisionPlugin#addOnCollideStart} */
    addOnCollideEnd<T extends CO, K extends CO>(config: ABConfig<T, K>): Unsubscribe;
    addOnCollideEnd<T extends CO>(config: AConfig<T>): Unsubscribe;
    /** This method mirrors {@link MatterCollisionPlugin#addOnCollideStart} */
    addOnCollideActive<T extends CO, K extends CO>(config: ABConfig<T, K>): Unsubscribe;
    addOnCollideActive<T extends CO>(config: AConfig<T>): Unsubscribe;
    /**
     * Remove any listeners that were added with addOnCollideStart. If objectB, callback or context
     * parameters are omitted, any listener matching the remaining parameters will be removed. E.g. if
     * you only specify objectA and objectB, all listeners with objectA & objectB will be removed
     * regardless of the callback or context.
     */
    removeOnCollideStart<T extends CO, K extends CO>(config: RemoveABConfig<T, K>): void;
    removeOnCollideStart<T extends CO>(config: RemoveAConfig<T>): void;
    /** This method mirrors {@link MatterCollisionPlugin#removeOnCollideStart} */
    removeOnCollideEnd<T extends CO, K extends CO>(config: RemoveABConfig<T, K>): void;
    removeOnCollideEnd<T extends CO>(config: RemoveAConfig<T>): void;
    /** This method mirrors {@link MatterCollisionPlugin#removeOnCollideStart} */
    removeOnCollideActive<T extends CO, K extends CO>(config: RemoveABConfig<T, K>): void;
    removeOnCollideActive<T extends CO>(config: RemoveAConfig<T>): void;
    /** Remove any listeners that were added with addOnCollideStart. */
    removeAllCollideStartListeners(): void;
    /** Remove any listeners that were added with addOnCollideActive. */
    removeAllCollideActiveListeners(): void;
    /** Remove any listeners that were added with addOnCollideEnd. */
    removeAllCollideEndListeners(): void;
    /**
     * Remove any listeners that were added with addOnCollideStart, addOnCollideActive or
     * addOnCollideEnd.
     */
    removeAllCollideListeners(): void;
    private addOnCollide;
    private removeOnCollide;
    private addOnCollideObjectVsObject;
    private onCollisionStart;
    private onCollisionEnd;
    private onCollisionActive;
    /**
     * Reusable handler for collisionstart, collisionend, collisionactive.
     * */
    private onCollisionEvent;
    private checkPairAndEmit;
    subscribeMatterEvents(): void;
    unsubscribeMatterEvents(): void;
    start(): void;
    shutdown(): void;
    destroy(): void;
}
