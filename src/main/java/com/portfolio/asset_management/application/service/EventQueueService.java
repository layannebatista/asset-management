package com.portfolio.asset_management.application.service;

import java.util.LinkedList;
import java.util.Queue;
import org.springframework.stereotype.Service;

@Service
public class EventQueueService {

  private final Queue<Runnable> queue = new LinkedList<>();

  public synchronized void enqueue(Runnable event) {
    queue.add(event);
  }

  public synchronized void processNext() {
    Runnable event = queue.poll();
    if (event != null) {
      event.run();
    }
  }

  public synchronized int pendingEvents() {
    return queue.size();
  }

  public synchronized void processAll() {
    while (!queue.isEmpty()) {
      processNext();
    }
  }
}
